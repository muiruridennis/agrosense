// notifications/notification-preferences.service.ts (NEW - ADD THIS)
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotificationPreference,
  Frequency,
} from './entities/notification-preference.entity';
import { UpdatePreferencesDto } from './dtos';

@Injectable()
export class NotificationPreferencesService {
  private readonly logger = new Logger(NotificationPreferencesService.name);

  constructor(
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepo: Repository<NotificationPreference>,
  ) {}

  /**
   * Get default preferences template
   */
  getDefaultPreferences() {
    return {
      channels: {
        email: true,
        sms: true,
        push: true,
        inApp: true,
        whatsapp: false,
      },
      categories: {
        'mortality-spike': {
          enabled: true,
          priority: 'critical' as const,
          frequency: Frequency.INSTANT,
        },
        'disease-alert': {
          enabled: true,
          priority: 'high' as const,
          frequency: Frequency.INSTANT,
        },
        'production-target': {
          enabled: true,
          priority: 'medium' as const,
          frequency: Frequency.DAILY,
        },
        'pricing-update': {
          enabled: false,
          priority: 'low' as const,
          frequency: Frequency.DAILY,
        },
      },
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
        days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        overrideForCritical: true,
      },
      defaultFrequency: Frequency.INSTANT,
      digestPreferences: {
        dailyTime: '09:00',
        weeklyDay: 'MON',
        weeklyTime: '09:00',
        includeCategories: ['production-target', 'pricing-update'],
      },
    };
  }

  /**
   * Get user's notification preferences
   * @throws BadRequestException if userId is invalid
   */
  async getUserPreferences(userId: string): Promise<NotificationPreference> {
    

    // Try to find existing preferences
    let prefs = await this.preferenceRepo.findOne({
      where: { userId },
    });

    // If not found, create default preferences
    if (!prefs) {
      prefs = this.preferenceRepo.create({
        userId,
        ...this.getDefaultPreferences(),
      });
      try {
        prefs = await this.preferenceRepo.save(prefs);
        this.logger.log(`Created default preferences for user ${userId}`);
      } catch (error) {
        this.logger.error(
          `Failed to create preferences for user ${userId}:`,
          error,
        );
        throw new BadRequestException(
          'Failed to create user preferences. Please check if user exists.',
        );
      }
    }

    return prefs;
  }

  /**
   * Get preferences for a specific farm
   * @throws BadRequestException if userId or farmId is invalid
   */
  async getFarmPreferences(
    userId: string,
    farmId: string,
  ): Promise<NotificationPreference> {
    if (!userId || !farmId) {
      throw new BadRequestException('Valid user ID and farm ID are required');
    }

    let prefs = await this.preferenceRepo.findOne({
      where: { userId, farmId },
    });

    if (!prefs) {
      prefs = this.preferenceRepo.create({
        userId,
        farmId,
        ...this.getDefaultPreferences(),
      });
      try {
        prefs = await this.preferenceRepo.save(prefs);
        this.logger.log(
          `Created default preferences for user ${userId}, farm ${farmId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to create farm preferences for user ${userId}, farm ${farmId}:`,
          error,
        );
        throw new BadRequestException(
          'Failed to create farm preferences. Please verify user and farm exist.',
        );
      }
    }

    return prefs;
  }

  /**
   * Update entire preference object
   */
  async updatePreferences(
    userId: string,
    dto: UpdatePreferencesDto,
  ): Promise<NotificationPreference> {
    let prefs = await this.preferenceRepo.findOne({
      where: { userId },
    });

    if (!prefs) {
      prefs = this.preferenceRepo.create({ userId });
    }

    // Update fields
    Object.assign(prefs, dto);
    prefs = await this.preferenceRepo.save(prefs);

    this.logger.log(`Updated preferences for user ${userId}`);
    return prefs;
  }

  /**
   * Update only channel settings
   */
  async updateChannels(
    userId: string,
    channels: Record<string, boolean>,
  ): Promise<NotificationPreference> {
    const prefs = await this.getUserPreferences(userId);

    // Validate channels
    const validChannels = ['email', 'sms', 'push', 'inApp', 'whatsapp'];
    for (const [key, value] of Object.entries(channels)) {
      if (!validChannels.includes(key)) {
        throw new BadRequestException(`Invalid channel: ${key}`);
      }
      if (typeof value !== 'boolean') {
        throw new BadRequestException(`Channel ${key} must be boolean`);
      }
    }

    prefs.channels = {
      ...prefs.channels,
      ...channels,
    };

    await this.preferenceRepo.save(prefs);
    this.logger.log(`Updated channels for user ${userId}`);
    return prefs;
  }

  /**
   * Update quiet hours
   */
  async updateQuietHours(
    userId: string,
    quietHours: any,
  ): Promise<NotificationPreference> {
    const prefs = await this.getUserPreferences(userId);

    // Validate
    if (
      quietHours.enabled !== undefined &&
      typeof quietHours.enabled !== 'boolean'
    ) {
      throw new BadRequestException('enabled must be boolean');
    }

    if (quietHours.start && !this.isValidTime(quietHours.start)) {
      throw new BadRequestException('start time must be HH:MM format');
    }

    if (quietHours.end && !this.isValidTime(quietHours.end)) {
      throw new BadRequestException('end time must be HH:MM format');
    }

    prefs.quietHours = {
      ...prefs.quietHours,
      ...quietHours,
    };

    await this.preferenceRepo.save(prefs);
    this.logger.log(`Updated quiet hours for user ${userId}`);
    return prefs;
  }

  /**
   * Update specific category
   */
  async updateCategory(
    userId: string,
    category: string,
    settings: { enabled: boolean; frequency?: Frequency },
  ): Promise<NotificationPreference> {
    const prefs = await this.getUserPreferences(userId);

    if (!category) {
      throw new BadRequestException('Category is required');
    }

    // Validate frequency
    if (settings.frequency) {
      const validFrequencies = Object.values(Frequency);
      if (!validFrequencies.includes(settings.frequency)) {
        throw new BadRequestException(
          `Invalid frequency. Must be one of: ${validFrequencies.join(', ')}`,
        );
      }
    }

    prefs.categories[category] = {
      enabled: settings.enabled,
      frequency: settings.frequency || Frequency.INSTANT,
      priority: prefs.categories[category]?.priority || ('medium' as const),
    };

    await this.preferenceRepo.save(prefs);
    this.logger.log(
      `Updated category "${category}" for user ${userId}: ${settings.enabled ? 'enabled' : 'disabled'}`,
    );
    return prefs;
  }

  /**
   * Reset preferences to defaults
   * @throws BadRequestException if userId is invalid or reset fails
   */
  async resetPreferences(userId: string): Promise<NotificationPreference> {
    if (!userId || typeof userId !== 'string') {
      throw new BadRequestException('Valid user ID is required');
    }

    let prefs = await this.preferenceRepo.findOne({
      where: { userId },
    });

    if (!prefs) {
      prefs = this.preferenceRepo.create({ userId });
    }

    // Reset to defaults
    Object.assign(prefs, this.getDefaultPreferences());

    try {
      prefs = await this.preferenceRepo.save(prefs);
      this.logger.log(`Reset preferences to default for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to reset preferences for user ${userId}:`,
        error,
      );
      throw new BadRequestException(
        'Failed to reset preferences. Please check if user exists.',
      );
    }

    return prefs;
  }

  /**
   * Check if user has enabled a specific channel
   * (Used by processor to check if delivery is allowed)
   */
  async isChannelEnabled(userId: string, channel: string): Promise<boolean> {
    const prefs = await this.getUserPreferences(userId);
    const channelKey = this.normalizeChannelName(channel);
    return prefs.channels[channelKey] ?? true; // Default to enabled if not set
  }

  /**
   * Check if category is enabled
   * (Used by processor)
   */
  async isCategoryEnabled(userId: string, category: string): Promise<boolean> {
    if (!category) return true;

    const prefs = await this.getUserPreferences(userId);
    return prefs.categories[category]?.enabled ?? true; // Default to enabled if not set
  }

  /**
   * Check if currently in quiet hours
   * (Used by processor)
   */
  isCurrentlyInQuietHours(quietHours: any): boolean {
    if (!quietHours?.enabled) return false;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dayName = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][
      now.getDay()
    ];

    // Check if today is in quiet hours days
    if (quietHours.days && !quietHours.days.includes(dayName)) {
      return false;
    }

    // Check if current time is between start and end
    const start = quietHours.start; // "22:00"
    const end = quietHours.end; // "08:00"

    if (start <= end) {
      // Normal case: 10:00 - 14:00
      return currentTime >= start && currentTime <= end;
    } else {
      // Wraps around midnight: 22:00 - 08:00
      return currentTime >= start || currentTime <= end;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ───────────────────────────────────────────────────────────────────────────

  private isValidTime(time: string): boolean {
    const regex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  }

  private normalizeChannelName(channel: string): string {
    const map = {
      email: 'email',
      sms: 'sms',
      push: 'push',
      in_app: 'inApp',
      inapp: 'inApp',
      whatsapp: 'whatsapp',
    };
    return map[channel.toLowerCase()] || channel;
  }
}
