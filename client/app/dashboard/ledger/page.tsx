"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecordsTable } from "./records-table";
import { RecordFormModal } from "./components/record-form-modal";
import { RecordDetailsSheet } from "./components/record-details-sheet";
import {
  useFarms,
  useRecords,
  useCreateRecord,
  useUpdateRecord,
  useDeleteRecord,
} from "@/lib/hooks/useDashboard";
import { FarmRecord, CreateRecordInput, UpdateRecordInput } from "@/types";

export default function LedgerPage() {
  const { data: farms = [] } = useFarms();
  const [selectedFarmId, setSelectedFarmId] = useState<string | undefined>();
  const [selectedRecord, setSelectedRecord] = useState<FarmRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (!selectedFarmId && farms.length > 0) {
      setSelectedFarmId(farms[0].id);
    }
  }, [farms, selectedFarmId]);

  const { data: records = [], isPending: isRecordsPending } =
    useRecords(selectedFarmId);
  const createMutation = useCreateRecord(selectedFarmId ?? "");
  const updateMutation = useUpdateRecord(
    selectedRecord?.id ?? "",
    selectedFarmId ?? "",
  );
  const deleteMutation = useDeleteRecord(selectedFarmId ?? "");

  const totalIncome = useMemo(
    () =>
      records
        .filter(
          (record) =>
            record.recordType === "income" || record.recordType === "harvest",
        )
        .reduce((sum, record) => sum + Number(record.amount), 0),
    [records],
  );

  const totalExpenses = useMemo(
    () =>
      records
        .filter(
          (record) =>
            record.recordType !== "income" && record.recordType !== "harvest",
        )
        .reduce((sum, record) => sum + Number(record.amount), 0),
    [records],
  );

  const handleAddClick = () => {
    setSelectedRecord(null);
    setFormOpen(true);
  };

  const handleViewRecord = (record: FarmRecord) => {
    setSelectedRecord(record);
    setDetailsOpen(true);
  };

  const handleEditRecord = (record: FarmRecord) => {
    setSelectedRecord(record);
    setDetailsOpen(false);
    setFormOpen(true);
  };

  const handleDeleteRecord = async (recordId: string) => {
    await deleteMutation.mutateAsync(recordId);
  };

  const handleFormSubmit = async (
    data: CreateRecordInput | UpdateRecordInput,
  ) => {
    if (selectedRecord) {
      await updateMutation.mutateAsync(data as UpdateRecordInput);
    } else {
      await createMutation.mutateAsync(data as CreateRecordInput);
    }
  };

  const toolbar = (
    <Button
      onClick={handleAddClick}
      size="sm"
      gap="md"
      disabled={!selectedFarmId}
    >
      <Plus className="h-4 w-4" />
      New record
    </Button>
  );

  const selectedFarm = farms.find((farm) => farm.id === selectedFarmId);
  const emptyState = !selectedFarmId
    ? "Select a farm to view ledger records."
    : records.length === 0 && !isRecordsPending
      ? "No ledger records yet — add your first expense or income record."
      : undefined;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">FarmLedger</h1>
        <p className="text-muted-foreground">
          Track income, expenses and operational records for your farm.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="text-sm font-medium">Farm</label>
              <select
                value={selectedFarmId ?? ""}
                onChange={(e) => setSelectedFarmId(e.target.value || undefined)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Choose a farm...</option>
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedFarm && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{selectedFarm.region}</span>
                <span>•</span>
                <span>{selectedFarm.areaHectares.toFixed(2)} ha</span>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-emerald-600">
                  KES {totalIncome.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-red-600">
                  KES {totalExpenses.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Net profit</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant={
                    totalIncome >= totalExpenses ? "secondary" : "destructive"
                  }
                  className="text-sm"
                >
                  KES {(totalIncome - totalExpenses).toLocaleString()}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <RecordsTable
            records={records}
            isPending={isRecordsPending}
            toolbar={toolbar}
            onView={handleViewRecord}
            onEdit={handleEditRecord}
            onDelete={handleDeleteRecord}
            isDeleting={deleteMutation.isPending}
            emptyState={emptyState}
            onRowClick={handleViewRecord}
          />
        </div>
      </div>

      <RecordFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={selectedRecord}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <RecordDetailsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        record={selectedRecord}
        onEdit={handleEditRecord}
      />
    </div>
  );
}
