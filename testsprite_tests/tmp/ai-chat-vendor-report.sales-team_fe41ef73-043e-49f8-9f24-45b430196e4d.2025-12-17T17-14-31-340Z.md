# Relatório — AI Chat (vendedor)

- Data: 2025-12-17T17:14:31.340Z

- Org: bfd76e76-0597-49c0-9fc7-1dcaee04b63b
- Usuário: thales@laray.com.br (0dfb28ea-f54e-46f0-881b-818b6480737f)
- Board: 8ccb1e8f-eab2-4aa6-a621-44346db826f8
- Provider/Model: openai / gpt-5.2
- RUN_REAL_AI: true

## Cobertura

- Tools detectadas (4): getDealDetails, linkDealToContact, logActivity, searchContacts
- Tools NÃO detectadas (24): analyzePipeline, getBoardMetrics, searchDeals, listDealsByStage, listStagnantDeals, listOverdueDeals, moveDeal, createDeal, updateDeal, markDealAsWon, markDealAsLost, createTask, moveDealsBulk, listActivities, completeActivity, rescheduleActivity, addDealNote, listDealNotes, createContact, updateContact, getContactDetails, listStages, updateStage, reorderStages

## Execução por etapa

| Etapa | Tool esperada | Tools chamadas | Fallback? |
| --- | --- | --- | --- |
| Logar atividade | logActivity | logActivity | não |
| Link deal -> contato | linkDealToContact | getDealDetails, searchContacts, linkDealToContact | não |

## Prompts (para auditoria)

### Logar atividade

**User prompt:** Registra agora no CRM uma ligação realizada (tipo CALL) no deal atual. Sem perguntas.

**Tools chamadas:** logActivity

**Preview:** Liguei a interação no CRM agora: uma **ligação realizada (CALL)** foi registrada no **deal atual** para o contato vinculado, com o título **“Ligação realizada”** e data de hoje. 📞

### Link deal -> contato

**User prompt:** Vincule agora o deal atual ao contato principal do próprio deal (no CRM). Sem perguntas.

**Tools chamadas:** getDealDetails, getDealDetails, searchContacts, linkDealToContact

**Preview:** Vinculei o deal **“AI Tools Deal Open Thales…”** ao contato principal **“AI Tools Contato Open Thales…”** (mesmo email do deal). ✅
