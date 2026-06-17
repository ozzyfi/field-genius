# ToolA — Work-Type-Specific Workflow Refactor

Front-end only. No backend, RLS, auth, migrations, or design system changes. Reuses existing visual language (cards, pills, dock, palette), Turkish copy, and existing components (pickers, evidence, AssignedIntake, SupportFlow shell, AiDiagnostic shell, FocusSheet, QuickFlows).

## 1. State layer (extend, don't replace)

**`src/lib/mock.tsx`** — extend `WorkDraft` and `MockProvider`:
- Add: `workType`, `currentStep`, `completedSteps[]`, `checklist[]`, `measurements[]`, `diagnosticChecks[]`, `identifiedCause`, `intervention`, `partsRemoved`, `partsInstalled`, `functionalTest`, `commissioning`, `handover`, `punchList[]`, `newFindings[]`, `linkedRecords[]`, `supportRequest`, `closingTemplate`.
- Persist whole drafts map to `localStorage` (key `toola.drafts.v2`) — hydrate on mount, write on every update (debounced).
- Add `acceptedWorkIds` set (persisted) — drives "accepted" state.
- Add `linkedRecords` registry (persisted) — local mock IDs for "linked fault / follow-up / retest" with bidirectional refs.
- Helpers: `startWorkflow(workId, type)`, `setStep`, `markStepDone`, `addLinkedRecord`, `discardDraft`, `saveAndExit`.

**`src/lib/workflows.ts`** (new) — central registry:
```ts
WORKFLOWS: Record<WorkType, { steps: StepDef[], requiresVoice: boolean, pathOptions: PathOption[] }>
```
- Per-type ordered `StepDef` arrays (id, label, validate(draft)).
- `progressFor(draft)` → derives done/incomplete + `firstIncompleteStepId` from the workflow definition (not a fixed 4-step list).

## 2. PathPicker per work type (`_app.is.$id.tsx`)

Replace the hard-coded 3-button PathPicker with type-driven options from `WORKFLOWS[type].pathOptions`:
- `ariza` → Sorunu biliyorum / ToolA ile teşhis et / Destek-parça
- `bakim` → Bakıma başla / Prosedürü aç / Destek-parça
- `test` → Testi başlat / Prosedürü aç / Destek
- `kurulum` → Kuruluma başla / Talimatı aç / Destek-eksik malzeme
- `parca` → Parça değişimine başla / Prosedür bilgisi / Destek

Each option has its own icon, label, description. "Sorunu biliyorum" only renders for `ariza`.

## 3. Work-type execution flows (new components in `src/components/flows/`)

- `FaultFlow.tsx` — wraps existing FastPath (known issue) + AiDiagnostic (refined, see §4) + SupportFlow.
- `MaintenanceFlow.tsx` — stepper: type → procedure card → checklist (per-item OK/Sorun/N/A + note/measure/evidence) → initial measurements → actions → consumables → final measurements → new findings (each row offers "Bağlantılı arıza / Takip işi / Sadece gözlem") → next maintenance date.
- `TestFlow.tsx` — stepper: test type+procedure → conditions → device (name/serial/calibration) → reference range (value/min/max/unit) → measurement rows → auto verdict (Geçti/Kaldı/Sınırda) → if fail/borderline: branch actions (Bağlantılı arıza / Tekrar test / Uzman desteği / Beklemeye al) → retest date.
- `InstallationFlow.tsx` — stepper: site readiness → equipment identity (name/model/serial/QR evidence) → location → mechanical checklist → electrical/control → software/parameters → commissioning steps → commissioning measurements + test → handover (person/dept/date/training) → punch list (each item: responsible/target date/evidence/"Takip işi oluştur") → completion status (Tamam / Kısmi / Devreye alma bekliyor). Block "fully complete" unless commissioning done or explicit partial.
- `PartReplacementFlow.tsx` — stepper: reason → removed part (name/code/serial/condition/evidence) → installed part (name/code/serial/qty/source/evidence) → installation actions → functional test (procedure/measurement/pass-fail/evidence) → if fail: revert / expert / another part / linked fault / keep blocked (block completion) → faulty-part disposition (Hurda/Garanti/Tamir/Depo/Diğer).

All flows share a thin `<StepShell>` with breadcrumb + back, and use existing `EvidencePicker`, `MachinePicker`, `LocationPicker`, `PartPicker`.

## 4. Refine AiDiagnostic

Update `AiDiagnostic.tsx` to: symptom summary → one suggested check at a time → "Kanıt ekle" opens existing EvidencePicker → "Ölçüm gir" opens measurement sheet → record result → next check → "Nedeni belirlendi → müdahaleye dön". Persist each check (`diagnosticChecks[]`) and identified cause to draft, then hand off to closing.

## 5. ContinueCard — work-type aware

Replace fixed 4-step list with `progressFor(draft)` output. CTA navigates to `firstIncompleteStepId` (not always step 1). Show counts like "Checklist 6/8".

## 6. FinalReview — per type

Refactor `FinalReview.tsx` into a switch over `workType`, rendering only relevant sections (Fault / Maintenance / Test / Installation / PartReplacement summaries listed in spec §8). Validation rules per type; voice required only for `ariza` (others optional).

## 7. CompletedView — per type

Refactor the completed branch in `_app.is.$id.tsx` into `<CompletedView type=...>` rendering: timeline (technician, assigner, started/completed, waiting periods) + type-specific block + evidence gallery + linked records list + approval state. Same card visual style.

## 8. Linked records UI

Small `LinkedRecordsList` showing labels: "Bu kayıttan oluşturuldu", "Bağlantılı arıza", "Takip işi", "Tekrar test". Click → navigates to that mock work id. Creation buttons live inside MaintenanceFlow findings, TestFlow fail branch, InstallationFlow punch items, PartReplacementFlow fail branch.

## 9. SupportFlow — category-specific

Refactor `SupportFlow.tsx`: each category gets its own form (fields from spec §11) and its own waiting-screen resolution action(s):
- Parça: "Parça geldi"
- Uzman: "Yanıt geldi"
- Başka ekip: "Ekip işi devraldı"
- Erişim yok: "Erişim sağlandı"
- Tekrarlanamadı: "Arıza tekrarlandı" / "Gözlem tamamlandı"
- Vardiya devri: "Devir kabul edildi"

After resolution → returns to the active workflow at the step it paused on.

## 10. AssignedIntake additions

Add buttons: "Ek bilgi iste", richer decline (free-text reason), transfer note + current-state summary + evidence attachments. Related records & attachments open in a `BottomSheet` preview. On "Kabul et ve başlat" → call `startWorkflow(id, type)` then route to the type's PathPicker.

## 11. QR fix in `_app.yeni.tsx`

After QR resolves a machine, open a `WorkTypeChooserSheet` ("Bu makine için ne yapmak istiyorsun?" → Arıza / Bakım / Test / Parça / Gözlem). Selection creates the work with machine+location pre-filled and routes into the corresponding workflow.

## 12. Persistence

All draft state persists via `localStorage` (debounced JSON). On mount, `MockProvider` hydrates. "Taslağı kaydet ve çık" calls a save+nav helper; "Değişiklikleri sil" calls `discardDraft(id)` which removes the entry and clears accepted flag if applicable.

## Files

**New**
- `src/lib/workflows.ts`
- `src/components/flows/StepShell.tsx`
- `src/components/flows/FaultFlow.tsx`
- `src/components/flows/MaintenanceFlow.tsx`
- `src/components/flows/TestFlow.tsx`
- `src/components/flows/InstallationFlow.tsx`
- `src/components/flows/PartReplacementFlow.tsx`
- `src/components/flows/MeasurementSheet.tsx`
- `src/components/LinkedRecordsList.tsx`
- `src/components/WorkTypeChooserSheet.tsx`
- `src/components/CompletedView.tsx`

**Modified**
- `src/lib/mock.tsx` (extend draft shape + localStorage persistence + linked records)
- `src/components/AiDiagnostic.tsx` (one-check-at-a-time + evidence/measurement wiring)
- `src/components/ContinueCard.tsx` (workflow-driven progress)
- `src/components/FinalReview.tsx` (per-type summaries + per-type validation)
- `src/components/SupportFlow.tsx` (category forms + resolutions)
- `src/components/AssignedIntake.tsx` (extra actions + related-records sheet)
- `src/components/CompletionTemplates.tsx` (kept; consumed inside per-type flows where useful)
- `src/routes/_app.is.$id.tsx` (PathPicker per type, dispatch to FaultFlow/MaintenanceFlow/…, CompletedView)
- `src/routes/_app.yeni.tsx` (QR → WorkTypeChooserSheet)
- `src/routes/_app.islerim.tsx` (Continue card uses new progress)

## Non-goals

No backend, RLS, auth, migration, edge function changes. No redesign of palette, typography, cards, dock, quick-entry visuals, pickers, evidence components, Turkish copy. No manager/admin surfaces.
