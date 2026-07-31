import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailTemplateService {
  private baseUrl: string;
  private appName: string;
  private supportEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('app.url', 'https://agrosense.com');
    this.appName = this.configService.get<string>('app.name', 'AgroSense');
    this.supportEmail = this.configService.get<string>('support.email', 'support@agrosense.com');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BASE TEMPLATE - Elegant, responsive, brand-consistent
  // ──────────────────────────────────────────────────────────────────────────

  private getBaseTemplate(content: string, options?: {
    previewText?: string;
    headerImage?: string;
    headerColor?: string;
  }): string {
    const previewText = options?.previewText || 'Farm management insights from AgroSense';
    const headerColor = options?.headerColor || '#16a34a';

    return `
      <!DOCTYPE html>
      <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="x-apple-disable-message-reformatting">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>${this.appName}</title>
          <!--[if gte mso 9]>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          <![endif]-->
          <style>
            /* ── Reset & Base ── */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1a1a2e;
              background-color: #f4f6f9;
              margin: 0;
              padding: 0;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            table {
              border-collapse: collapse;
              mso-table-lspace: 0;
              mso-table-rspace: 0;
              width: 100%;
            }
            /* ── Container ── */
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px 16px;
              background-color: #f4f6f9;
            }
            .email-container {
              background-color: #ffffff;
              border-radius: 16px;
              box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
              overflow: hidden;
            }
            /* ── Header ── */
            .email-header {
              background: linear-gradient(135deg, ${headerColor}, #15803d);
              padding: 32px 40px 28px;
              text-align: center;
              position: relative;
            }
            .email-header::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: linear-gradient(90deg, #fbbf24, #f59e0b);
            }
            .email-header h1 {
              color: #ffffff;
              font-size: 28px;
              font-weight: 700;
              letter-spacing: -0.5px;
              margin: 0;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .email-header .subtitle {
              color: rgba(255,255,255,0.85);
              font-size: 14px;
              font-weight: 400;
              margin-top: 4px;
              letter-spacing: 0.3px;
            }
            .email-header .logo-icon {
              font-size: 36px;
              display: block;
              margin-bottom: 4px;
            }
            /* ── Preview Text (hidden) ── */
            .preview-text {
              display: none;
              font-size: 1px;
              color: #f4f6f9;
              mso-hide: all;
            }
            /* ── Content ── */
            .email-content {
              padding: 32px 40px 24px;
              background: #ffffff;
            }
            .email-content h2 {
              font-size: 22px;
              font-weight: 700;
              color: #1a1a2e;
              margin-bottom: 12px;
              letter-spacing: -0.3px;
            }
            .email-content h3 {
              font-size: 16px;
              font-weight: 600;
              color: #1a1a2e;
              margin: 20px 0 8px;
            }
            .email-content p {
              font-size: 15px;
              color: #374151;
              margin-bottom: 12px;
              line-height: 1.7;
            }
            .email-content .text-muted {
              color: #6b7280;
              font-size: 14px;
            }
            .email-content .text-small {
              font-size: 13px;
              color: #6b7280;
            }
            /* ── Alerts ── */
            .alert-box {
              border-radius: 10px;
              padding: 16px 20px;
              margin: 16px 0;
              border-left: 4px solid;
            }
            .alert-critical {
              background: #fef2f2;
              border-color: #dc2626;
            }
            .alert-high {
              background: #fffbeb;
              border-color: #f59e0b;
            }
            .alert-medium {
              background: #eff6ff;
              border-color: #3b82f6;
            }
            .alert-info {
              background: #f0fdf4;
              border-color: #22c55e;
            }
            .alert-critical .alert-title { color: #dc2626; font-weight: 600; }
            .alert-high .alert-title { color: #d97706; font-weight: 600; }
            .alert-medium .alert-title { color: #2563eb; font-weight: 600; }
            .alert-info .alert-title { color: #16a34a; font-weight: 600; }
            /* ── Stats Grid ── */
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
              gap: 12px;
              margin: 16px 0 20px;
            }
            .stat-card {
              background: #f8fafc;
              border-radius: 10px;
              padding: 14px 12px;
              text-align: center;
              border: 1px solid #e5e7eb;
              transition: all 0.2s;
            }
            .stat-card .stat-value {
              font-size: 24px;
              font-weight: 700;
              color: #1a1a2e;
              line-height: 1.2;
            }
            .stat-card .stat-label {
              font-size: 11px;
              font-weight: 500;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-top: 2px;
            }
            .stat-card .stat-icon {
              font-size: 20px;
              display: block;
              margin-bottom: 2px;
            }
            /* ── Buttons ── */
            .btn {
              display: inline-block;
              padding: 12px 28px;
              font-size: 15px;
              font-weight: 600;
              text-decoration: none;
              border-radius: 8px;
              transition: all 0.3s;
              text-align: center;
              cursor: pointer;
            }
            .btn-primary {
              background: #16a34a;
              color: #ffffff !important;
              box-shadow: 0 2px 8px rgba(22, 163, 74, 0.25);
            }
            .btn-primary:hover {
              background: #15803d;
              box-shadow: 0 4px 16px rgba(22, 163, 74, 0.35);
              transform: translateY(-1px);
            }
            .btn-outline {
              background: transparent;
              color: #16a34a !important;
              border: 2px solid #16a34a;
            }
            .btn-outline:hover {
              background: #f0fdf4;
            }
            .btn-danger {
              background: #dc2626;
              color: #ffffff !important;
              box-shadow: 0 2px 8px rgba(220, 38, 38, 0.25);
            }
            /* ── Divider ── */
            .divider {
              border: none;
              height: 1px;
              background: linear-gradient(to right, transparent, #e5e7eb, transparent);
              margin: 24px 0;
            }
            /* ── List ── */
            .list-clean {
              list-style: none;
              padding: 0;
              margin: 12px 0;
            }
            .list-clean li {
              padding: 8px 0 8px 28px;
              background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%2316a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>') left center no-repeat;
              background-size: 16px;
              color: #374151;
            }
            .list-clean li + li {
              border-top: 1px solid #f3f4f6;
            }
            /* ── Footer ── */
            .email-footer {
              padding: 20px 40px 28px;
              background: #fafafa;
              border-top: 1px solid #e5e7eb;
              text-align: center;
            }
            .email-footer p {
              font-size: 12px;
              color: #6b7280;
              margin: 4px 0;
              line-height: 1.6;
            }
            .email-footer a {
              color: #16a34a;
              text-decoration: none;
              font-weight: 500;
            }
            .email-footer a:hover {
              text-decoration: underline;
            }
            .email-footer .social-links {
              margin: 8px 0 12px;
            }
            .email-footer .social-links a {
              display: inline-block;
              margin: 0 6px;
              font-size: 20px;
              text-decoration: none;
            }
            .footer-divider {
              border: none;
              height: 1px;
              background: #e5e7eb;
              margin: 12px 0;
            }
            /* ── Responsive ── */
            @media (max-width: 480px) {
              .email-wrapper { padding: 12px 8px; }
              .email-content { padding: 20px 16px; }
              .email-header { padding: 24px 16px 20px; }
              .email-header h1 { font-size: 22px; }
              .email-footer { padding: 16px 16px 20px; }
              .stats-grid {
                grid-template-columns: 1fr 1fr;
                gap: 8px;
              }
              .stat-card .stat-value { font-size: 20px; }
              .btn { display: block; width: 100%; padding: 14px; }
              .email-content h2 { font-size: 19px; }
            }
            @media (max-width: 380px) {
              .stats-grid { grid-template-columns: 1fr; }
            }
            /* ── Dark Mode Support ── */
            @media (prefers-color-scheme: dark) {
              body { background-color: #1a1a2e; }
              .email-wrapper { background-color: #1a1a2e; }
              .email-container { background-color: #2d2d44; }
              .email-content { background: #2d2d44; }
              .email-content h2 { color: #f1f5f9; }
              .email-content h3 { color: #f1f5f9; }
              .email-content p { color: #cbd5e1; }
              .text-muted { color: #94a3b8; }
              .stat-card { background: #3d3d5c; border-color: #4d4d6c; }
              .stat-card .stat-value { color: #f1f5f9; }
              .stat-card .stat-label { color: #94a3b8; }
              .email-footer { background: #25253a; border-color: #3d3d5c; }
              .email-footer p { color: #94a3b8; }
              .divider { background: linear-gradient(to right, transparent, #3d3d5c, transparent); }
              .list-clean li { color: #cbd5e1; border-top-color: #3d3d5c; }
              .alert-critical { background: #3d1a1a; border-color: #dc2626; }
              .alert-high { background: #3d2a0a; border-color: #f59e0b; }
              .alert-medium { background: #1a2a4d; border-color: #3b82f6; }
              .alert-info { background: #1a3d2a; border-color: #22c55e; }
              .btn-primary { background: #22c55e; }
              .btn-primary:hover { background: #16a34a; }
              .btn-outline { color: #22c55e !important; border-color: #22c55e; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="preview-text">${previewText}</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <div class="email-container">
                    <!-- Header -->
                    <div class="email-header">
                      <span class="logo-icon">🌾</span>
                      <h1>${this.appName}</h1>
                      <div class="subtitle">Smart Farm Management</div>
                    </div>
                    <!-- Content -->
                    <div class="email-content">
                      ${content}
                    </div>
                    <!-- Footer -->
                    <div class="email-footer">
                      <p>
                        <a href="${this.baseUrl}">${this.appName}</a> · 
                        <a href="${this.baseUrl}/settings/notifications">Manage Preferences</a>
                      </p>
                      <p>
                        <a href="mailto:${this.supportEmail}">${this.supportEmail}</a>
                      </p>
                      <hr class="footer-divider">
                      <p>
                        © ${new Date().getFullYear()} ${this.appName}. All rights reserved.
                      </p>
                      <p style="font-size:11px; color:#9ca3af;">
                        This email was sent to you because you are a registered user of ${this.appName}.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DISEASE ALERT TEMPLATE
  // ──────────────────────────────────────────────────────────────────────────

  renderDiseaseAlert(data: {
    farmName: string;
    houseName: string;
    species: string;
    deaths: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    diseaseName?: string;
    actions?: string[];
    veterinarian?: { name: string; phone: string; };
  }): string {
    const severityEmojis = {
      low: 'ℹ️',
      medium: '⚠️',
      high: '🚨',
      critical: '🔴',
    };

    const severityLabels = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'CRITICAL',
    };

    const alertClass = `alert-${data.severity}`;
    const severityColor = data.severity === 'critical' ? '#dc2626' : 
                          data.severity === 'high' ? '#f59e0b' : 
                          data.severity === 'medium' ? '#3b82f6' : '#22c55e';

    const content = `
      <div class="alert-box ${alertClass}">
        <div class="alert-title">
          ${severityEmojis[data.severity]} ${severityLabels[data.severity].toUpperCase()} DISEASE ALERT
        </div>
        <p style="margin-top:8px;">
          <strong>Farm:</strong> ${data.farmName}<br>
          <strong>House:</strong> ${data.houseName}<br>
          <strong>Species:</strong> ${data.species}<br>
          <strong>Deaths Reported:</strong> ${data.deaths} in the last 6 hours
          ${data.diseaseName ? `<br><strong>Suspected Disease:</strong> ${data.diseaseName}` : ''}
        </p>
      </div>

      <h3>🚨 Immediate Actions Required</h3>
      <ul class="list-clean">
        ${(data.actions || [
          'Isolate affected animals immediately',
          'Contact your veterinarian',
          'Review and tighten biosecurity protocols',
          'Monitor remaining animals closely for symptoms',
          'Record all observations for veterinary consultation',
        ]).map(action => `<li>${action}</li>`).join('')}
      </ul>

      ${data.veterinarian ? `
        <h3>📞 Contact Your Veterinarian</h3>
        <div style="background:#f8fafc; border-radius:8px; padding:12px 16px; border:1px solid #e5e7eb; margin:8px 0 16px;">
          <p style="margin:0;"><strong>${data.veterinarian.name}</strong></p>
          <p style="margin:0; font-size:14px; color:#6b7280;">📱 ${data.veterinarian.phone}</p>
        </div>
      ` : ''}

      <hr class="divider">

      <div style="text-align:center; margin:20px 0 8px;">
        <a href="${this.baseUrl}/disease/${data.farmName}/alerts" class="btn btn-primary">
          📊 View Disease Report
        </a>
      </div>
      <p style="text-align:center; font-size:13px; color:#6b7280;">
        ⏰ Alert sent: ${new Date().toLocaleString()}
      </p>
    `;

    return this.getBaseTemplate(content, {
      previewText: `🚨 ${data.severity.toUpperCase()} disease alert for ${data.farmName}`,
      headerColor: severityColor,
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DAILY DIGEST TEMPLATE
  // ──────────────────────────────────────────────────────────────────────────

  renderDailyDigest(data: {
    farmName: string;
    date: Date;
    stats: {
      eggs: number;
      milk: number;
      mortality: number;
      feedConsumed: number;
      waterConsumed?: number;
    };
    tasks: {
      completed: number;
      pending: number;
      overdue: number;
    };
    alerts: Array<{ title: string; severity: 'low' | 'medium' | 'high'; }>;
    weather?: {
      condition: string;
      temp: number;
      humidity: number;
    };
  }): string {
    const hasAlerts = data.alerts && data.alerts.length > 0;

    const content = `
      <h2>📋 Daily Farm Digest</h2>
      <p style="color:#6b7280; margin-top:-4px; font-size:14px;">
        ${data.farmName} · ${data.date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </p>

      <h3>📊 Production Summary</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-icon">🥚</span>
          <div class="stat-value">${data.stats.eggs}</div>
          <div class="stat-label">Eggs Collected</div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🥛</span>
          <div class="stat-value">${data.stats.milk}L</div>
          <div class="stat-label">Milk Yield</div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">💀</span>
          <div class="stat-value">${data.stats.mortality}</div>
          <div class="stat-label">Mortality</div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🌾</span>
          <div class="stat-value">${data.stats.feedConsumed}kg</div>
          <div class="stat-label">Feed Consumed</div>
        </div>
        ${data.stats.waterConsumed ? `
          <div class="stat-card">
            <span class="stat-icon">💧</span>
            <div class="stat-value">${data.stats.waterConsumed}L</div>
            <div class="stat-label">Water Consumed</div>
          </div>
        ` : ''}
      </div>

      ${data.weather ? `
        <h3>🌤️ Today's Weather</h3>
        <div style="background:#f8fafc; border-radius:10px; padding:12px 16px; border:1px solid #e5e7eb; margin:8px 0 16px; display:flex; justify-content:space-between; flex-wrap:wrap;">
          <span><strong>Condition:</strong> ${data.weather.condition}</span>
          <span><strong>Temperature:</strong> ${data.weather.temp}°C</span>
          <span><strong>Humidity:</strong> ${data.weather.humidity}%</span>
        </div>
      ` : ''}

      <h3>✅ Tasks</h3>
      <div style="display:flex; gap:16px; flex-wrap:wrap; margin:8px 0 16px;">
        <span>✔️ Completed: <strong>${data.tasks.completed}</strong></span>
        <span>⏳ Pending: <strong>${data.tasks.pending}</strong></span>
        ${data.tasks.overdue > 0 ? `
          <span style="color:#dc2626;">⚠️ Overdue: <strong>${data.tasks.overdue}</strong></span>
        ` : ''}
      </div>

      ${hasAlerts ? `
        <h3>⚠️ Active Alerts (${data.alerts.length})</h3>
        <ul class="list-clean">
          ${data.alerts.map(alert => `
            <li>
              ${alert.severity === 'high' ? '🔴' : alert.severity === 'medium' ? '🟡' : '🟢'}
              ${alert.title}
            </li>
          `).join('')}
        </ul>
      ` : `
        <div class="alert-box alert-info" style="margin:16px 0;">
          <div class="alert-title">✅ All Clear</div>
          <p style="margin:4px 0 0;">No active alerts. Your farm is operating smoothly.</p>
        </div>
      `}

      <hr class="divider">

      <div style="text-align:center; margin:20px 0 8px; display:flex; gap:12px; flex-wrap:wrap; justify-content:center;">
        <a href="${this.baseUrl}/dashboard/${data.farmName}" class="btn btn-primary">
          📊 View Dashboard
        </a>
        <a href="${this.baseUrl}/tasks/${data.farmName}" class="btn btn-outline">
          📋 View Tasks
        </a>
      </div>
    `;

    return this.getBaseTemplate(content, {
      previewText: `📋 Daily digest for ${data.farmName}`,
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VACCINATION REMINDER TEMPLATE
  // ──────────────────────────────────────────────────────────────────────────

  renderVaccinationReminder(data: {
    farmName: string;
    animalType: string;
    vaccineName: string;
    dueDate: Date;
    count: number;
    notes?: string;
    location?: string;
  }): string {
    const isOverdue = data.dueDate < new Date();
    const daysUntil = Math.ceil((data.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    const content = `
      <h2>💉 Vaccination Reminder</h2>
      
      <div class="alert-box ${isOverdue ? 'alert-critical' : 'alert-high'}">
        <div class="alert-title">
          ${isOverdue ? '🔴 OVERDUE' : '⚠️ UPCOMING'}
        </div>
        <p style="margin-top:8px;">
          <strong>Farm:</strong> ${data.farmName}<br>
          <strong>Animal Type:</strong> ${data.animalType}<br>
          <strong>Vaccine:</strong> ${data.vaccineName}<br>
          <strong>Due Date:</strong> ${data.dueDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}<br>
          <strong>Animals to Vaccinate:</strong> ${data.count}
          ${data.location ? `<br><strong>Location:</strong> ${data.location}` : ''}
          ${daysUntil <= 7 && !isOverdue ? `<br><strong>⏰ ${daysUntil} days remaining</strong>` : ''}
        </p>
      </div>

      ${data.notes ? `
        <h3>📝 Notes</h3>
        <div style="background:#f8fafc; border-radius:8px; padding:12px 16px; border:1px solid #e5e7eb; margin:8px 0 16px;">
          <p style="margin:0;">${data.notes}</p>
        </div>
      ` : ''}

      <h3>📋 Preparation Checklist</h3>
      <ul class="list-clean">
        <li>Verify vaccine storage temperature</li>
        <li>Check expiration date</li>
        <li>Prepare clean syringes and needles</li>
        <li>Have a record-keeping system ready</li>
        <li>Plan for post-vaccination monitoring</li>
      </ul>

      <hr class="divider">

      <div style="text-align:center; margin:20px 0 8px;">
        <a href="${this.baseUrl}/vaccinations/${data.farmName}" class="btn btn-primary">
          📋 View Vaccination Schedule
        </a>
      </div>
    `;

    return this.getBaseTemplate(content, {
      previewText: `💉 Vaccination reminder for ${data.farmName}`,
      headerColor: isOverdue ? '#dc2626' : '#f59e0b',
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // WELCOME EMAIL TEMPLATE
  // ──────────────────────────────────────────────────────────────────────────

  renderWelcome(data: {
    userFirstName: string;
    farmName: string;
    verificationLink: string;
  }): string {
    const content = `
      <h2>👋 Welcome to ${this.appName}, ${data.userFirstName}!</h2>
      <p style="font-size:17px;">
        We're excited to help you manage <strong>${data.farmName}</strong> more efficiently.
      </p>

      <div class="alert-box alert-info" style="margin:20px 0;">
        <div class="alert-title">🚀 Quick Start Guide</div>
        <ol style="margin:8px 0 0 20px; color:#374151;">
          <li><strong>Verify your email</strong> — Click the button below</li>
          <li><strong>Complete your profile</strong> — Add farm details</li>
          <li><strong>Add your first flock/herd</strong> — Start tracking</li>
          <li><strong>Set up notifications</strong> — Stay informed</li>
        </ol>
      </div>

      <div style="text-align:center; margin:24px 0;">
        <a href="${data.verificationLink}" class="btn btn-primary" style="font-size:16px; padding:14px 36px;">
          ✅ Verify Your Email Address
        </a>
      </div>

      <hr class="divider">

      <h3>✨ What You Can Do With ${this.appName}</h3>
      <ul class="list-clean">
        <li>🌾 Track production and performance metrics</li>
        <li>🐔 Monitor animal health and welfare</li>
        <li>📊 Generate automated reports and insights</li>
        <li>📱 Receive real-time alerts and notifications</li>
        <li>👥 Collaborate with your farm team</li>
      </ul>

      <div style="background:#f0fdf4; border-radius:10px; padding:16px 20px; margin:16px 0;">
        <p style="margin:0; font-size:14px; color:#16a34a;">
          💡 <strong>Pro Tip:</strong> Set up your notification preferences to receive only the alerts that matter most to you.
        </p>
      </div>

      <p style="text-align:center; font-size:14px; color:#6b7280; margin-top:20px;">
        Have questions? <a href="mailto:${this.supportEmail}">Contact our support team</a>
      </p>
    `;

    return this.getBaseTemplate(content, {
      previewText: `Welcome to ${this.appName}, ${data.userFirstName}!`,
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEMPERATURE ALERT TEMPLATE
  // ──────────────────────────────────────────────────────────────────────────

  renderTemperatureAlert(data: {
    farmName: string;
    houseName: string;
    temperature: number;
    threshold: number;
    humidity?: number;
    direction: 'above' | 'below';
    recommendations?: string[];
  }): string {
    const isAbove = data.direction === 'above';
    const emoji = isAbove ? '🔥' : '❄️';
    const severity = Math.abs(data.temperature - data.threshold) > 5 ? 'high' : 'medium';

    const content = `
      <h2>${emoji} Temperature ${isAbove ? 'High' : 'Low'} Alert</h2>
      
      <div class="alert-box alert-${severity}">
        <div class="alert-title">
          ${isAbove ? '🌡️' : '🌡️'} Temperature ${isAbove ? 'Exceeded' : 'Dropped Below'} Threshold
        </div>
        <p style="margin-top:8px;">
          <strong>Farm:</strong> ${data.farmName}<br>
          <strong>House:</strong> ${data.houseName}<br>
          <strong>Current Temperature:</strong> ${data.temperature}°C<br>
          <strong>Threshold:</strong> ${data.threshold}°C<br>
          ${data.humidity ? `<strong>Humidity:</strong> ${data.humidity}%<br>` : ''}
          <strong>Status:</strong> ${isAbove ? '⚠️ Above optimal range' : '⚠️ Below optimal range'}
        </p>
      </div>

      <h3>📋 Recommended Actions</h3>
      <ul class="list-clean">
        ${(data.recommendations || [
          isAbove 
            ? 'Increase ventilation/airflow'
            : 'Add supplemental heating',
          isAbove
            ? 'Check cooling systems (fans, misters)'
            : 'Check heating systems (heaters, lamps)',
          'Monitor animal behavior for signs of distress',
          'Document conditions for trend analysis',
        ]).map(action => `<li>${action}</li>`).join('')}
      </ul>

      <hr class="divider">

      <div style="text-align:center; margin:20px 0 8px;">
        <a href="${this.baseUrl}/environment/${data.farmName}/monitoring" class="btn btn-primary">
          📊 View Environment Dashboard
        </a>
      </div>
    `;

    return this.getBaseTemplate(content, {
      previewText: `🌡️ Temperature alert for ${data.farmName}`,
      headerColor: isAbove ? '#dc2626' : '#3b82f6',
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // LOW STOCK ALERT TEMPLATE
  // ──────────────────────────────────────────────────────────────────────────

  renderLowStockAlert(data: {
    farmName: string;
    itemName: string;
    category: 'feed' | 'medication' | 'supply';
    currentStock: number;
    threshold: number;
    unit: string;
    daysUntilEmpty?: number;
    supplier?: string;
    orderLink?: string;
  }): string {
    const emojis = {
      feed: '🌾',
      medication: '💊',
      supply: '📦',
    };

    const urgency = data.daysUntilEmpty && data.daysUntilEmpty <= 3 ? 'critical' : 'high';

    const content = `
      <h2>${emojis[data.category]} ${data.category.charAt(0).toUpperCase() + data.category.slice(1)} Low Stock Alert</h2>
      
      <div class="alert-box alert-${urgency}">
        <div class="alert-title">
          ⚠️ ${data.category.toUpperCase()} Stock is Critically Low
        </div>
        <p style="margin-top:8px;">
          <strong>Farm:</strong> ${data.farmName}<br>
          <strong>Item:</strong> ${data.itemName}<br>
          <strong>Current Stock:</strong> ${data.currentStock} ${data.unit}<br>
          <strong>Threshold:</strong> ${data.threshold} ${data.unit}<br>
          ${data.daysUntilEmpty ? `<strong>Estimated Days Until Empty:</strong> ${data.daysUntilEmpty} days` : ''}
          ${data.supplier ? `<br><strong>Supplier:</strong> ${data.supplier}` : ''}
        </p>
      </div>

      <h3>📋 Recommended Actions</h3>
      <ul class="list-clean">
        <li>${data.daysUntilEmpty && data.daysUntilEmpty <= 3 ? '🚨 Place order immediately' : '📋 Place order today'}</li>
        <li>Review consumption patterns</li>
        <li>Consider alternative suppliers if needed</li>
        <li>Update inventory records</li>
      </ul>

      <hr class="divider">

      <div style="text-align:center; margin:20px 0 8px; display:flex; gap:12px; flex-wrap:wrap; justify-content:center;">
        <a href="${this.baseUrl}/inventory/${data.farmName}" class="btn btn-primary">
          📦 View Inventory
        </a>
        ${data.orderLink ? `
          <a href="${data.orderLink}" class="btn btn-outline">
            🛒 Place Order
          </a>
        ` : ''}
      </div>
    `;

    return this.getBaseTemplate(content, {
      previewText: `⚠️ Low stock alert for ${data.farmName}`,
      headerColor: urgency === 'critical' ? '#dc2626' : '#f59e0b',
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GENERIC TEMPLATE
  // ──────────────────────────────────────────────────────────────────────────

  renderGeneric(data: {
    title: string;
    message: string;
    actionText?: string;
    actionUrl?: string;
    severity?: 'info' | 'success' | 'warning' | 'error';
  }): string {
    const severityClass = data.severity || 'info';
    const alertColors = {
      info: 'alert-info',
      success: 'alert-info',
      warning: 'alert-high',
      error: 'alert-critical',
    };

    const content = `
      <div class="alert-box ${alertColors[severityClass]}">
        <div class="alert-title">${data.title}</div>
        <p style="margin-top:8px;">${data.message}</p>
      </div>

      ${data.actionText && data.actionUrl ? `
        <div style="text-align:center; margin:20px 0 8px;">
          <a href="${data.actionUrl}" class="btn btn-primary">
            ${data.actionText}
          </a>
        </div>
      ` : ''}
    `;

    return this.getBaseTemplate(content, {
      previewText: data.title,
    });
  }
}