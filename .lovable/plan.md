
# ToolA — Workflow Completion & Bug-Fix Pass

This is a second-pass cleanup of the existing technician prototype. The current work-type flows (Fault, Maintenance, Test, Installation, Part Replacement), visual identity, floating dock, pickers, evidence components and Turkish UI are preserved. No backend, migration, RLS or auth change.

## Goals

One typed local source of truth for every work record, with persistence that survives refresh. Status, machine, planned date, support state and completion gating actually behave differently. Every visible CTA produces a real state transition. Every evidence card is inspectable. Validation matches the work type.

## Approach

### A. Typed workflow store (one source of truth)

Create `src/lib/workflow/` modules:

```text
workflow/
  types.ts          // WorkflowStatus + per-type WorkDraft union
  status.ts         // status helpers, label maps, status → list filters
  validation.ts     // per-type required-field checks
  progress.ts       // per-type step progress + firstIncompleteStepId
  persistence.ts    // localStorage load/save with versioned key
  workflow-config.ts// per-type step list, path options, labels
```

Refactor `src/lib/mock.tsx`:
- Replace `template: Record<string, any>` with a discriminated `WorkDraft` union (`FaultDraft | MaintenanceDraft | TestDraft | InstallationDraft | PartReplacementDraft | OtherDraft`).
- Keep machine, location, plannedAt, workflowStatus, currentStepId, completedSteps, evidence, measurements, checklist, diagnosticChecks, supportRequest, linkedRecords, completionData, dirty (per record), lastSavedAt.
- Maintain a separate completed-snapshot map so finished records keep their rich data without polluting active drafts.
- Per-record dirty flags (Map<workId, boolean>), no global boolean.

### B. Machine + planned date persistence

- New record / QR / picker / AI extract all write `machineId` + `machineName` into the draft AND into the Supabase work row when `machine_id` column exists (use existing column; do not add new ones).
- Distinguish `machineLocation` vs `workLocation`; prefill from machine but allow override.
- Work detail header always re-reads `draft.machine`; "Makine bağla" shows only when truly empty.
- `plannedAt` lives in the typed draft (no schema change). `_app.islerim.tsx` filters "Bugün planlanan" by `plannedAt` instead of `created_at`. Show `Bugün / Yarın / Gecikti / Planlandı` chips on cards + detail. Immediate ("Hemen") records skip planned filtering.

### C. Status model + completion gating

- `WorkflowStatus` union as specified; map only where the existing backend `status` enum matches.
- Installation: `tamamlandi` blocked unless `commTestResult === "gecti"` AND `completionStatus === "tam"`; otherwise `kismi_tamamlandi` or `devreye_alma_bekliyor`. Open punch-list items remain visible.
- Test: failing/borderline result requires choosing linked-fault / retest / expert / blocked / approved-exception before close.
- Part replacement: failed `funcTest` blocks completion; user must pick expert / other part / linked fault / revert / block — each opens its real flow (SupportFlow forms, linked record creation).

### D. Support pause / resume

- When `draft.supportRequest && !supportRequest.resolvedAt`: `_app.is.$id.tsx` hides PathPicker and renders SupportWaiting as primary state.
- Preserve `interruptedStepId` on the draft. Resolution sheet (per category) writes resolution payload, marks resolved, restores `currentStepId = interruptedStepId`, shows "Kaldığın yerden devam et".
- Category-specific resolution actions (Parça geldi / Yanıt geldi / Ekip devraldı / Erişim sağlandı / Arıza tekrarlandı | Gözlem tamamlandı / Devir kabul edildi) — refactor `SupportFlow.tsx` to render only the relevant action per category, with labelled rows (no JSON dumps).
- "Destek bekleyen" list filter only includes unresolved support.

### E. Continue card routing

`ContinueCard` chooses target by:
1. Unresolved support → support waiting screen.
2. Completed → completed detail (and removed from active anyway).
3. Partial → first remaining required step or punch-list.
4. Any incomplete step → that step.
5. All complete → final review.

CTA label adapts to context ("Son ölçümlere devam et", "Test sonucunu değerlendir", "Devreye almaya devam et", "Kontrol et ve kapat").

### F. Procedure / full-screen viewers

- "Prosedürü aç" / "Talimatı aç" open a `DocumentViewerSheet` with sample content; on close return to first incomplete step of the current type (not path picker).
- "Kaynağı tam ekran aç" opens the same viewer full screen.
- Evidence cards (photo/video/audio/measurement) open `EvidencePreviewSheet` with full-screen photo, `<video controls>`, `<audio controls>`, transcript display, before/after side-by-side. Add Replace / Remove / Go-to-step buttons.
- Same preview used in `FinalReview` and `CompletedView` (read-only in completed; correction request CTA only).

### G. Per-type validation

Implement in `validation.ts`:
- Fault: initial evidence + voice + final evidence + intervention + result + root-cause kind (kesin/tahmini/bilinmiyor).
- Maintenance: type + procedure decision + checklist done + actions + nextDate (when applicable). Explicit N/A toggles: "Ölçüm gerekli değil", "Sarf kullanılmadı", "Parça kullanılmadı", "Yeni bulgu yok". Checklist "Sorun bulundu" → require note/evidence + decision (linked fault / follow-up / observation).
- Test: testType + procedure + ref range + unit + device + calibration state + ≥1 measurement + verdict. Calibration date when required. Retest date when retest chosen.
- Installation: equipment identity + location + site suitability + each mechanical / electrical checklist item explicitly `Uygun | Sorun bulundu | Uygulanamaz` + commissioning result + completion state. Kısmi requires reason + open items + owner + due. Training fields when required.
- Part: reason + removed/installed identity + codes + serials (or "Seri numarası yok") + qty + source + removed condition + disposition + install actions + funcTest procedure + funcTest result + final evidence.

### H. Assigned-work intake (decline / transfer)

Multi-step sheets in `AssignedIntake.tsx`:
- Decline: reason → explanation → optional evidence → confirm. Persist all four + timestamp.
- Transfer: technician → current-state summary → handover note → evidence → recommended next step → confirm. Persist all + timestamp.
- Related records / attachments openable via existing preview sheet.

### I. Failed-branch real flows

`AiDiagnostic`, `TestFlow`, `PartReplacementFlow`:
- "Uzman desteği iste" → opens `SupportFlow` (expert).
- "İşi beklemeye al" → opens block-reason form, sets `workflowStatus = "blokeli"`.
- "Başka parça iste" → opens part-request form.
- "Bağlantılı arıza oluştur" → creates linked mock record (already exists; ensure visible link).
- "Tekrar test planla" → creates linked retest record with required date.
- Linked relations show on detail: "Bu kayıttan oluşturuldu / Bağlantılı arıza / Tekrar test / Takip işi / Parça talebi".

### J. Draft save / discard

`AppShell` dirty-state sheet:
- Save: persist draft, set `lastSavedAt`, clear that record's dirty flag, then navigate; toast "Taslak cihaza kaydedildi".
- Continue: close sheet only.
- Discard: revert to last persisted snapshot (or delete if new), clear dirty, then navigate.
- Per-record dirty tracking driven by every mutation (checklist, measurement, evidence, support, diagnostic).

### K. Misc fixes

- `_app.islerim.tsx` search: matches title, description, work code, machine name/code/model/serial, location.
- Work-type labels via `WORK_TYPE_LABELS` map; never render raw enum.
- Profile button in `AppShell` opens a profile sheet (Kullanıcı bilgileri / Senkronizasyon / Ayarlar / Çıkış yap with confirm) — no immediate logout.
- Active-work card filter excludes completed/cancelled/resolved-only records.
- Audit and wire remaining dead buttons (photo-add-later, full-screen source, audio playback, measurement preview, related-record open, AI diagnostic "Kanıt ekle" / "Ölçüm gir").

### L. Cleanup

- Remove obsolete `CompletionTemplates.tsx` (replaced by per-type flows).
- Consolidate the QR work-type chooser (`WorkTypeChooserSheet`) — single implementation.
- Remove unused step helpers; keep `workflow-config.ts` as the single registry.

## Files

New:
- `src/lib/workflow/types.ts`, `status.ts`, `validation.ts`, `progress.ts`, `persistence.ts`, `workflow-config.ts`
- `src/components/EvidencePreviewSheet.tsx`
- `src/components/DocumentViewerSheet.tsx`
- `src/components/ProfileSheet.tsx`
- `src/components/SupportWaiting.tsx` (extracted from `SupportFlow`)

Edited:
- `src/lib/mock.tsx` (typed draft + per-record dirty + completed snapshot)
- `src/lib/workflows.ts` → thin re-export from new modules (kept temporarily for callers)
- `src/components/AppShell.tsx` (profile sheet, dirty sheet behavior)
- `src/components/ContinueCard.tsx` (smart routing + CTA)
- `src/components/FinalReview.tsx` + `CompletedView.tsx` (evidence preview, per-type sections)
- `src/components/AssignedIntake.tsx` (multi-step decline/transfer)
- `src/components/SupportFlow.tsx` (category-only actions, resume)
- `src/components/AiDiagnostic.tsx` (real "Kanıt ekle"/"Ölçüm gir"/branch actions)
- `src/components/flows/*.tsx` (typed draft, validation, branch wiring)
- `src/components/QuickFlows.tsx` (machine persistence in QR/AI paths)
- `src/routes/_app.islerim.tsx` (search, planned filter, active-work filter, labels)
- `src/routes/_app.is.$id.tsx` (support-pause routing, machine display, continue routing)
- `src/routes/_app.yeni.tsx` (plannedAt + machine persistence)

Removed:
- `src/components/CompletionTemplates.tsx`

## Out of scope

- Any backend, migration, RLS or auth change.
- Visual redesign, new modules, dashboards, navigation items.
- New schema columns — prototype-only fields stay in the typed local draft.

## Verification

- TypeScript build passes.
- Manual walk for each work type: create → step through → refresh mid-flow → resume → support pause → resolve → resume → close → completed detail.
- Installation failed commissioning stays partial.
- Part failed test blocks close and offers branch actions.
- Test failed result requires retest/linked-fault/expert/block/exception.
- Draft save and discard verified on a dirty record.
- Evidence preview opens from final review and completed detail.
