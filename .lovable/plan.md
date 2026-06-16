# ToolA — Front-end Prototype Completion

All work is **front-end only**. No Supabase migrations, RLS, auth, env or server code changes. Mock data lives in a new `MockProvider`; existing Supabase queries are preserved.

## New files

- `src/lib/mockData.ts` — static mock data: machines, locations (Tesis→Bina→Kat→Alan→Oda), similar cases, technical docs, notifications, sync queue items, parts catalog.
- `src/lib/mock.tsx` — `MockProvider` with: focus mode (hides nav), sync/connectivity state, notifications, per-work local draft state (continue-from-last, support waiting state, completion template fields, evidence picker), unsaved-changes flag, draft confirmation sheet.
- `src/components/FocusSheet.tsx` — full-screen overlay (sets focus mode while open).
- `src/components/QuickFlows.tsx` — `VoiceRecorderSheet`, `CameraCaptureSheet`, `QrScannerSheet`, `AiExtractPreview` (mock AI extraction → editable fields → create work).
- `src/components/Pickers.tsx` — `MachinePicker` (search/QR/recent/filter), `LocationPicker` (hierarchy), `PartPicker`.
- `src/components/AssignedIntake.tsx` — assigned-work intake card (Kabul et / Uygun değil / Devret / Destek iste).
- `src/components/ContinueCard.tsx` — progress + "3. adımdan devam et".
- `src/components/AiDiagnostic.tsx` — mock diagnostic flow with sources, evidence/measurement actions, result options, next step.
- `src/components/SupportFlow.tsx` — structured support categories + waiting state screen with timeline.
- `src/components/CompletionTemplates.tsx` — per work-type forms (Arıza, Bakım, Test, Kurulum, Parça).
- `src/components/FinalReview.tsx` — single review screen with missing-info, "Kontrol ettim, kanıtlı kapat".
- `src/components/EvidencePicker.tsx` — typed picker (Foto/Video/Ses/Ölçüm/Hata kodu/Belge/Barkod) + Önce/Sırasında/Sonra classification.
- `src/routes/_app.bildirimler.tsx` — notification centre route.

## Modified files

- `src/routes/__root.tsx` — wrap with `MockProvider`.
- `src/components/AppShell.tsx` — hide `+` on `/yeni`; hide whole dock in focus mode; bell → `/bildirimler` with unread badge; small sync/offline chip; unsaved-changes confirm sheet on nav.
- `src/routes/_app.islerim.tsx` — add **Devam ettiğin iş** priority card (from mock draft) and grouped sections: Bana atanan, Bugün planlanan, Devam eden, Destek/parça bekleyen, Kapanışı eksik.
- `src/routes/_app.yeni.tsx` — quick-entry buttons open real flows (voice / camera / QR / manual). Manual form gets full fields incl. machine/location pickers, priority, photo, planned/immediate.
- `src/routes/_app.is.$id.tsx` — when assigned, show intake card before path picker. Show continue card if draft progress exists. Replace `AiPathStub` with `AiDiagnostic`. Replace `SupportPath` with `SupportFlow`. Add machine/location edit actions when "Belirlenmedi". After fast-path steps, route through `FinalReview` + per-type completion template. Completed view becomes auditable detail (evidence gallery, audio player, transcript, timeline).
- `src/routes/_app.ai.tsx` — 4 context cards become interactive: continue active, machine picker, similar cases list, doc-Q&A with sources or "verified source not found".
- `src/routes/_app.gecmis.tsx` — header section shows decision-support summary (open count, last failure/maintenance, recurring symptoms, recurrence interval) from mock above the list.

## States added

Empty: no assigned work, no search result, machine/QR not found, empty history, no evidence. Errors: camera/mic denied, upload failed, AI source not found, no internet, validation, conflict ("başka kullanıcı değiştirdi"). Loading + skeletons. Offline / Cihaza kaydedildi / Sync bekliyor / Sync edildi / Yükleme başarısız / Çakışma — all driven by mock provider so the chip toggles for the demo.

## Non-goals

No manager/admin features. No backend changes. No redesign of palette, typography, cards, pills, dock or `+` button.
