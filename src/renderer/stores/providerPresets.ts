// ═══════════════════════════════════════════════
// Aperture — Provider Presets (移植自 CC Switch)
//
// 65+ 预设 provider，按 backend 分组。
// 数据来源: cc-switch/src/config/*ProviderPresets.ts
// 适配到 Aperture 扁平的 ProviderPreset 模型
// ═══════════════════════════════════════════════

import type { BackendId, ProviderPreset } from '../stores/settingsStore'

/* ═══════════════════════════════════════════════
   Claude Code 预设 (18 providers)
   ═══════════════════════════════════════════════ */
const claudePresets: ProviderPreset[] = [
  {
    key: 'claude-official', name: 'Claude Official', backendId: 'claude',
    websiteUrl: 'https://www.anthropic.com/claude-code',
    endpoint: '', models: [],
    category: 'official', isOfficial: true,
    icon: 'anthropic', iconColor: '#D4915D',
  },
  {
    key: 'claude-shengsuanyun', name: 'Shengsuanyun', backendId: 'claude',
    websiteUrl: 'https://www.shengsuanyun.com/?from=CH_4HHXMRYF',
    apiKeyUrl: 'https://www.shengsuanyun.com/?from=CH_4HHXMRYF',
    endpoint: 'https://router.shengsuanyun.com/api',
    models: ['anthropic/claude-sonnet-5', 'anthropic/claude-haiku-4.5', 'anthropic/claude-opus-4.8'],
    apiFormat: 'anthropic',
    category: 'aggregator', isPartner: true, partnerPromotionKey: 'shengsuanyun',
    icon: 'shengsuanyun',
  },
  {
    key: 'claude-patewayai', name: 'PatewayAI', backendId: 'claude',
    websiteUrl: 'https://pateway.ai',
    apiKeyUrl: 'https://pateway.ai/?ch=etzpm8&aff=WB6M6F67#/',
    endpoint: 'https://api.pateway.ai',
    models: ['claude-sonnet-5'],
    apiFormat: 'openai_chat', apiKeyField: 'ANTHROPIC_API_KEY',
    category: 'third_party', isPartner: true, partnerPromotionKey: 'patewayai',
    icon: 'pateway',
  },
  {
    key: 'claude-huoshan-agentplan', name: '火山Agentplan', backendId: 'claude',
    websiteUrl: 'https://www.volcengine.com/activity/codingplan',
    apiKeyUrl: 'https://www.volcengine.com/activity/codingplan',
    endpoint: 'https://ark.cn-beijing.volces.com/api/coding',
    models: ['ark-code-latest'],
    category: 'cn_official', isPartner: true, partnerPromotionKey: 'volcengine_agentplan',
    icon: 'huoshan', iconColor: '#3370FF',
  },
  {
    key: 'claude-byteplus', name: 'BytePlus', backendId: 'claude',
    websiteUrl: 'https://www.byteplus.com/en/product/modelark',
    endpoint: 'https://ark.ap-southeast.bytepluses.com/api/coding',
    models: ['ark-code-latest'],
    category: 'cn_official', isPartner: true, partnerPromotionKey: 'byteplus',
    icon: 'byteplus', iconColor: '#3370FF',
  },
  {
    key: 'claude-doubaoseed', name: 'DouBaoSeed', backendId: 'claude',
    websiteUrl: 'https://console.volcengine.com/ark',
    endpoint: 'https://ark.cn-beijing.volces.com/api/compatible',
    models: ['doubao-seed-2-1-pro-260628'],
    category: 'cn_official', isPartner: true, partnerPromotionKey: 'doubaoseed',
    icon: 'doubao', iconColor: '#3370FF',
  },
  {
    key: 'claude-ccsub', name: 'CCSub', backendId: 'claude',
    websiteUrl: 'https://www.ccsub.net',
    apiKeyUrl: 'https://www.ccsub.net/register?ref=Y6Z8DXEA',
    endpoint: 'https://www.ccsub.net',
    models: ['claude-sonnet-5'],
    category: 'aggregator', isPartner: true, partnerPromotionKey: 'ccsub',
    icon: 'ccsub',
  },
  {
    key: 'claude-subrouter', name: 'SubRouter', backendId: 'claude',
    websiteUrl: 'https://subrouter.ai',
    apiKeyUrl: 'https://subrouter.ai/register?aff=l3ri',
    endpoint: 'https://subrouter.ai',
    models: ['claude-sonnet-5'],
    category: 'aggregator', isPartner: true, partnerPromotionKey: 'subrouter',
    icon: 'subrouter',
  },
  {
    key: 'claude-unity2', name: 'Unity2.ai', backendId: 'claude',
    websiteUrl: 'https://unity2.ai',
    apiKeyUrl: 'https://unity2.ai/register?source=ccs',
    endpoint: 'https://api.unity2.ai',
    models: ['claude-sonnet-5'],
    category: 'aggregator', isPartner: true, partnerPromotionKey: 'unity2',
    icon: 'unity2',
  },
  {
    key: 'claude-qiniu', name: 'Qiniu', backendId: 'claude',
    websiteUrl: 'https://s.qiniu.com/nMvAvy',
    apiKeyUrl: 'https://s.qiniu.com/nMvAvy',
    endpoint: 'https://api.qnaigc.com',
    models: ['claude-sonnet-5'],
    endpointCandidates: ['https://api.qnaigc.com', 'https://api.modelink.ai'],
    category: 'aggregator', isPartner: true, partnerPromotionKey: 'qiniu',
    icon: 'qiniu',
  },
  {
    key: 'claude-fenno', name: 'FennoAI', backendId: 'claude',
    websiteUrl: 'https://api.fenno.ai',
    apiKeyUrl: 'https://api.fenno.ai/register?redirect=/purchase&aff=P9MR3D3PLCNL',
    endpoint: 'https://api.fenno.ai',
    models: ['claude-sonnet-5'],
    category: 'aggregator', isPartner: true, partnerPromotionKey: 'fenno',
    icon: 'fenno',
  },
  {
    key: 'claude-zetaapi', name: 'ZetaAPI', backendId: 'claude',
    websiteUrl: 'https://zetaapi.ai',
    apiKeyUrl: 'https://zetaapi.ai/go/ccs',
    endpoint: 'https://api.zetaapi.ai',
    models: ['claude-sonnet-5'],
    category: 'aggregator', isPartner: true, partnerPromotionKey: 'zetaapi',
    icon: 'zetaapi',
  },
  {
    key: 'claude-teamorouter', name: 'TeamoRouter', backendId: 'claude',
    websiteUrl: 'https://teamorouter.com',
    apiKeyUrl: 'https://teamorouter.com/?utm_source=cc_switch',
    endpoint: 'https://api.teamorouter.com',
    models: ['claude-sonnet-5'],
    category: 'aggregator', isPartner: true, partnerPromotionKey: 'teamorouter',
    icon: 'teamorouter',
  },
  {
    key: 'claude-amux', name: 'Amux', backendId: 'claude',
    websiteUrl: 'https://amux.ai',
    endpoint: 'https://api.amux.ai',
    models: ['claude-sonnet-5'],
    category: 'aggregator', icon: 'amux',
  },
  {
    key: 'claude-deepseek', name: 'DeepSeek', backendId: 'claude',
    websiteUrl: 'https://platform.deepseek.com',
    endpoint: 'https://api.deepseek.com/anthropic',
    models: ['deepseek-v4-pro', 'deepseek-v4-flash'],
    category: 'cn_official', icon: 'deepseek', iconColor: '#1E88E5',
  },
  {
    key: 'claude-zhipu', name: 'Zhipu GLM', backendId: 'claude',
    websiteUrl: 'https://open.bigmodel.cn',
    apiKeyUrl: 'https://www.bigmodel.cn/claude-code?ic=RRVJPB5SII',
    endpoint: 'https://open.bigmodel.cn/api/anthropic',
    models: ['glm-5.1'],
    category: 'cn_official', icon: 'zhipu', iconColor: '#0F62FE',
  },
  {
    key: 'claude-kimi', name: 'Kimi', backendId: 'claude',
    websiteUrl: 'https://platform.kimi.com?aff=cc-switch',
    endpoint: 'https://api.moonshot.cn/anthropic',
    models: ['kimi-k2.7-code'],
    category: 'cn_official', primePartner: true,
    icon: 'kimi', iconColor: '#6366F1',
  },
  {
    key: 'claude-bailian', name: 'Bailian', backendId: 'claude',
    websiteUrl: 'https://bailian.console.aliyun.com',
    endpoint: 'https://dashscope.aliyuncs.com/apps/anthropic',
    models: ['qwen3-max'],
    category: 'cn_official', icon: 'bailian', iconColor: '#624AFF',
  },
]

/* ═══════════════════════════════════════════════
   Codex CLI 预设 (18 providers)
   ═══════════════════════════════════════════════ */
const codexPresets: ProviderPreset[] = [
  {
    key: 'codex-official', name: 'OpenAI Official', backendId: 'codex',
    websiteUrl: 'https://chatgpt.com/codex',
    endpoint: '', models: [],
    category: 'official', isOfficial: true,
    icon: 'openai', iconColor: '#00A67E',
  },
  {
    key: 'codex-shengsuanyun', name: 'Shengsuanyun', backendId: 'codex',
    websiteUrl: 'https://www.shengsuanyun.com/?from=CH_4HHXMRYF',
    endpoint: 'https://router.shengsuanyun.com/api/v1',
    models: ['openai/gpt-5.5'],
    apiFormat: 'openai_responses',
    category: 'aggregator', isPartner: true, icon: 'shengsuanyun',
  },
  {
    key: 'codex-patewayai', name: 'PatewayAI', backendId: 'codex',
    websiteUrl: 'https://pateway.ai',
    endpoint: 'https://api.pateway.ai/v1',
    models: ['gpt-5.5'],
    apiFormat: 'openai_responses',
    category: 'third_party', isPartner: true, icon: 'pateway',
  },
  {
    key: 'codex-huoshan', name: '火山Agentplan', backendId: 'codex',
    websiteUrl: 'https://www.volcengine.com/activity/codingplan',
    endpoint: 'https://ark.cn-beijing.volces.com/api/coding/v3',
    models: ['ark-code-latest'],
    apiFormat: 'openai_chat',
    category: 'cn_official', isPartner: true, icon: 'huoshan', iconColor: '#3370FF',
  },
  {
    key: 'codex-byteplus', name: 'BytePlus', backendId: 'codex',
    websiteUrl: 'https://www.byteplus.com/en/product/modelark',
    endpoint: 'https://ark.ap-southeast.bytepluses.com/api/coding/v3',
    models: ['ark-code-latest'],
    apiFormat: 'openai_chat',
    category: 'cn_official', isPartner: true, icon: 'byteplus', iconColor: '#3370FF',
  },
  {
    key: 'codex-doubaoseed', name: 'DouBaoSeed', backendId: 'codex',
    websiteUrl: 'https://console.volcengine.com/ark',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3',
    models: ['doubao-seed-2-1-pro-260628'],
    apiFormat: 'openai_responses',
    category: 'cn_official', isPartner: true, icon: 'doubao', iconColor: '#3370FF',
  },
  {
    key: 'codex-ccsub', name: 'CCSub', backendId: 'codex',
    websiteUrl: 'https://www.ccsub.net',
    endpoint: 'https://www.ccsub.net/v1',
    models: ['gpt-5.5'],
    apiFormat: 'openai_responses',
    category: 'aggregator', isPartner: true, icon: 'ccsub',
  },
  {
    key: 'codex-subrouter', name: 'SubRouter', backendId: 'codex',
    websiteUrl: 'https://subrouter.ai',
    endpoint: 'https://subrouter.ai/v1',
    models: ['gpt-5.5'], apiFormat: 'openai_responses',
    category: 'aggregator', isPartner: true, icon: 'subrouter',
  },
  {
    key: 'codex-unity2', name: 'Unity2.ai', backendId: 'codex',
    websiteUrl: 'https://unity2.ai',
    endpoint: 'https://api.unity2.ai',
    models: ['gpt-5.5'], apiFormat: 'openai_responses',
    category: 'aggregator', isPartner: true, icon: 'unity2',
  },
  {
    key: 'codex-qiniu', name: 'Qiniu', backendId: 'codex',
    websiteUrl: 'https://s.qiniu.com/nMvAvy',
    endpoint: 'https://api.qnaigc.com/bypass/openai/v1',
    models: ['gpt-5.5'], apiFormat: 'openai_responses',
    category: 'aggregator', isPartner: true, icon: 'qiniu',
  },
  {
    key: 'codex-fenno', name: 'FennoAI', backendId: 'codex',
    websiteUrl: 'https://api.fenno.ai',
    endpoint: 'https://api.fenno.ai',
    models: ['gpt-5.5'], apiFormat: 'openai_responses',
    category: 'aggregator', isPartner: true, icon: 'fenno',
  },
  {
    key: 'codex-zetaapi', name: 'ZetaAPI', backendId: 'codex',
    websiteUrl: 'https://zetaapi.ai',
    endpoint: 'https://api.zetaapi.ai/v1',
    models: ['gpt-5.5'], apiFormat: 'openai_responses',
    category: 'aggregator', isPartner: true, icon: 'zetaapi',
  },
  {
    key: 'codex-teamorouter', name: 'TeamoRouter', backendId: 'codex',
    websiteUrl: 'https://teamorouter.com',
    endpoint: 'https://api.teamorouter.com/v1',
    models: ['gpt-5.5'], apiFormat: 'openai_responses',
    category: 'aggregator', isPartner: true, icon: 'teamorouter',
  },
  {
    key: 'codex-amux', name: 'Amux', backendId: 'codex',
    websiteUrl: 'https://amux.ai',
    endpoint: 'https://api.amux.ai/v1',
    models: ['gpt-5.5'], apiFormat: 'openai_responses',
    category: 'aggregator', icon: 'amux',
  },
  {
    key: 'codex-code0', name: 'Code0', backendId: 'codex',
    websiteUrl: 'https://code0.ai',
    endpoint: 'https://code0.ai/v1',
    models: ['gpt-5.5'], apiFormat: 'openai_responses',
    category: 'aggregator', isPartner: true, icon: 'code0',
  },
  {
    key: 'codex-nekocode', name: 'NekoCode', backendId: 'codex',
    websiteUrl: 'https://nekocode.ai',
    endpoint: 'https://nekocode.ai/v1',
    models: ['gpt-5.5'], apiFormat: 'openai_responses',
    category: 'aggregator', isPartner: true, icon: 'nekocode',
  },
  {
    key: 'codex-azure', name: 'Azure OpenAI', backendId: 'codex',
    websiteUrl: 'https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/codex',
    endpoint: 'https://YOUR_RESOURCE_NAME.openai.azure.com/openai',
    models: ['gpt-5.5'], apiFormat: 'openai_responses',
    category: 'third_party', isOfficial: true,
    icon: 'azure', iconColor: '#0078D4',
  },
  {
    key: 'codex-deepseek', name: 'DeepSeek', backendId: 'codex',
    websiteUrl: 'https://platform.deepseek.com',
    endpoint: 'https://api.deepseek.com',
    models: ['deepseek-v4-flash', 'deepseek-v4-pro'],
    apiFormat: 'openai_chat',
    category: 'cn_official', icon: 'deepseek', iconColor: '#1E88E5',
  },
]

/* ═══════════════════════════════════════════════
   Gemini CLI 预设 (15 providers)
   ═══════════════════════════════════════════════ */
const geminiPresets: ProviderPreset[] = [
  {
    key: 'gemini-official', name: 'Google Official', backendId: 'gemini',
    websiteUrl: 'https://ai.google.dev/',
    apiKeyUrl: 'https://aistudio.google.com/apikey',
    endpoint: '', models: [],
    category: 'official', isOfficial: true,
    icon: 'gemini', iconColor: '#4285F4',
  },
  {
    key: 'gemini-shengsuanyun', name: 'Shengsuanyun', backendId: 'gemini',
    websiteUrl: 'https://www.shengsuanyun.com/?from=CH_4HHXMRYF',
    endpoint: 'https://router.shengsuanyun.com/api',
    models: ['google/gemini-3.5-flash'],
    category: 'aggregator', isPartner: true, icon: 'shengsuanyun',
  },
  {
    key: 'gemini-unity2', name: 'Unity2.ai', backendId: 'gemini',
    websiteUrl: 'https://unity2.ai',
    endpoint: 'https://api.unity2.ai',
    models: ['gemini-3.1-pro'],
    category: 'aggregator', isPartner: true, icon: 'unity2',
  },
  {
    key: 'gemini-subrouter', name: 'SubRouter', backendId: 'gemini',
    websiteUrl: 'https://subrouter.ai',
    endpoint: 'https://subrouter.ai/v1beta',
    models: ['gemini-3.5-flash'],
    category: 'aggregator', isPartner: true, icon: 'subrouter',
  },
  {
    key: 'gemini-qiniu', name: 'Qiniu', backendId: 'gemini',
    websiteUrl: 'https://s.qiniu.com/nMvAvy',
    endpoint: 'https://api.qnaigc.com/bypass/vertex',
    models: ['gemini-3.1-pro-preview'],
    category: 'aggregator', isPartner: true, icon: 'qiniu',
  },
  {
    key: 'gemini-code0', name: 'Code0', backendId: 'gemini',
    websiteUrl: 'https://code0.ai',
    endpoint: 'https://code0.ai',
    models: ['gemini-3.1-pro-preview'],
    category: 'aggregator', isPartner: true, icon: 'code0',
  },
  {
    key: 'gemini-packycode', name: 'PackyCode', backendId: 'gemini',
    websiteUrl: 'https://www.packyapi.com',
    endpoint: 'https://www.packyapi.com',
    models: ['gemini-3.5-flash'],
    category: 'third_party', isPartner: true, icon: 'packycode',
  },
  {
    key: 'gemini-apikeyfun', name: 'APIKEY.FUN', backendId: 'gemini',
    websiteUrl: 'https://apikey.fun',
    endpoint: 'https://api.apikey.fun',
    models: ['gemini-3.5-flash'],
    category: 'third_party', isPartner: true, icon: 'apikeyfun',
  },
  {
    key: 'gemini-apinebula', name: 'APINebula', backendId: 'gemini',
    websiteUrl: 'https://apinebula.com',
    endpoint: 'https://apinebula.com',
    models: ['gemini-3.5-flash'],
    category: 'third_party', isPartner: true, icon: 'apinebula',
  },
  {
    key: 'gemini-cubence', name: 'Cubence', backendId: 'gemini',
    websiteUrl: 'https://cubence.com',
    endpoint: 'https://api.cubence.com',
    models: ['gemini-3.5-flash'],
    category: 'third_party', isPartner: true, icon: 'cubence', iconColor: '#000000',
  },
  {
    key: 'gemini-aigocode', name: 'AIGoCode', backendId: 'gemini',
    websiteUrl: 'https://aigocode.com',
    endpoint: 'https://api.aigocode.com',
    models: ['gemini-3.5-flash'],
    category: 'third_party', isPartner: true, icon: 'aigocode', iconColor: '#5B7FFF',
  },
  {
    key: 'gemini-aicodemirror', name: 'AICodeMirror', backendId: 'gemini',
    websiteUrl: 'https://www.aicodemirror.com',
    endpoint: 'https://api.aicodemirror.com/api/gemini',
    models: ['gemini-3.5-flash'],
    category: 'third_party', isPartner: true, icon: 'aicodemirror', iconColor: '#000000',
  },
  {
    key: 'gemini-openrouter', name: 'OpenRouter', backendId: 'gemini',
    websiteUrl: 'https://openrouter.ai',
    apiKeyUrl: 'https://openrouter.ai/keys',
    endpoint: 'https://openrouter.ai/api',
    models: ['gemini-3.5-flash'],
    category: 'aggregator', icon: 'openrouter', iconColor: '#6566F1',
  },
  {
    key: 'gemini-cherryin', name: 'CherryIN', backendId: 'gemini',
    websiteUrl: 'https://open.cherryin.ai',
    endpoint: 'https://open.cherryin.net',
    models: ['google/gemini-3.5-flash'],
    category: 'aggregator', icon: 'cherryin',
  },
  {
    key: 'gemini-custom', name: '自定义', backendId: 'gemini',
    websiteUrl: '', endpoint: '',
    models: ['gemini-3.5-flash'],
    category: 'custom',
    description: '自定义 Gemini API 端点',
  },
]

/* ═══════════════════════════════════════════════
   Hermes Agent 预设 (10 providers)
   ═══════════════════════════════════════════════ */
const hermesPresets: ProviderPreset[] = [
  {
    key: 'hermes-shengsuanyun', name: 'Shengsuanyun', backendId: 'hermes',
    websiteUrl: 'https://www.shengsuanyun.com/?from=CH_4HHXMRYF',
    endpoint: 'https://router.shengsuanyun.com/api/v1',
    models: ['openai/gpt-5.5'],
    category: 'aggregator', isPartner: true, icon: 'shengsuanyun',
  },
  {
    key: 'hermes-qiniu', name: 'Qiniu', backendId: 'hermes',
    websiteUrl: 'https://s.qiniu.com/nMvAvy',
    endpoint: 'https://api.qnaigc.com/v1',
    models: ['gpt-5.5'],
    category: 'aggregator', isPartner: true, icon: 'qiniu',
  },
  {
    key: 'hermes-fenno', name: 'FennoAI', backendId: 'hermes',
    websiteUrl: 'https://api.fenno.ai',
    endpoint: 'https://api.fenno.ai/v1',
    models: ['gpt-5.5'],
    category: 'aggregator', isPartner: true, icon: 'fenno',
  },
  {
    key: 'hermes-zetaapi', name: 'ZetaAPI', backendId: 'hermes',
    websiteUrl: 'https://zetaapi.ai',
    endpoint: 'https://api.zetaapi.ai/v1',
    models: ['gpt-5.5'],
    category: 'aggregator', isPartner: true, icon: 'zetaapi',
  },
  {
    key: 'hermes-teamorouter', name: 'TeamoRouter', backendId: 'hermes',
    websiteUrl: 'https://teamorouter.com',
    endpoint: 'https://api.teamorouter.com/v1',
    models: ['gpt-5.5'],
    category: 'aggregator', isPartner: true, icon: 'teamorouter',
  },
  {
    key: 'hermes-code0', name: 'Code0', backendId: 'hermes',
    websiteUrl: 'https://code0.ai',
    endpoint: 'https://code0.ai/v1',
    models: ['gpt-5.5'],
    category: 'aggregator', isPartner: true, icon: 'code0',
  },
  {
    key: 'hermes-huoshan', name: '火山Agentplan', backendId: 'hermes',
    websiteUrl: 'https://www.volcengine.com/activity/codingplan',
    endpoint: 'https://ark.cn-beijing.volces.com/api/coding',
    models: ['ark-code-latest'], apiFormat: 'anthropic',
    category: 'cn_official', isPartner: true, icon: 'huoshan', iconColor: '#3370FF',
  },
  {
    key: 'hermes-doubaoseed', name: 'DouBaoSeed', backendId: 'hermes',
    websiteUrl: 'https://console.volcengine.com/ark',
    endpoint: 'https://ark.cn-beijing.volces.com/api/compatible',
    models: ['doubao-seed-2-1-pro-260628'], apiFormat: 'anthropic',
    category: 'cn_official', isPartner: true, icon: 'doubao', iconColor: '#3370FF',
  },
  {
    key: 'hermes-openrouter', name: 'OpenRouter', backendId: 'hermes',
    websiteUrl: 'https://openrouter.ai',
    apiKeyUrl: 'https://openrouter.ai/keys',
    endpoint: 'https://openrouter.ai/api/v1',
    models: ['anthropic/claude-opus-4-8', 'anthropic/claude-sonnet-5', 'openai/gpt-5.5', 'google/gemini-3.5-flash'],
    category: 'aggregator', icon: 'openrouter', iconColor: '#6366F1',
  },
  {
    key: 'hermes-deepseek', name: 'DeepSeek', backendId: 'hermes',
    websiteUrl: 'https://platform.deepseek.com',
    endpoint: 'https://api.deepseek.com',
    models: ['deepseek-v4-pro', 'deepseek-v4-flash'],
    category: 'cn_official', icon: 'deepseek', iconColor: '#1E88E5',
  },
]

/* ═══════════════════════════════════════════════
   OpenCode 预设 (8 providers)
   ═══════════════════════════════════════════════ */
const opencodePresets: ProviderPreset[] = [
  {
    key: 'opencode-shengsuanyun', name: 'Shengsuanyun', backendId: 'opencode',
    websiteUrl: 'https://www.shengsuanyun.com/?from=CH_4HHXMRYF',
    endpoint: 'https://router.shengsuanyun.com/api/v1',
    models: ['anthropic/claude-opus-4-8', 'anthropic/claude-sonnet-5'],
    apiFormat: 'anthropic',
    category: 'aggregator', isPartner: true, icon: 'shengsuanyun',
  },
  {
    key: 'opencode-qiniu', name: 'Qiniu', backendId: 'opencode',
    websiteUrl: 'https://s.qiniu.com/nMvAvy',
    endpoint: 'https://api.qnaigc.com/v1',
    models: ['gpt-5.5'],
    category: 'aggregator', isPartner: true, icon: 'qiniu',
  },
  {
    key: 'opencode-fenno', name: 'FennoAI', backendId: 'opencode',
    websiteUrl: 'https://api.fenno.ai',
    endpoint: 'https://api.fenno.ai/v1',
    models: ['gpt-5.5'],
    category: 'aggregator', isPartner: true, icon: 'fenno',
  },
  {
    key: 'opencode-zetaapi', name: 'ZetaAPI', backendId: 'opencode',
    websiteUrl: 'https://zetaapi.ai',
    endpoint: 'https://api.zetaapi.ai/v1',
    models: ['gpt-5.5'],
    category: 'aggregator', isPartner: true, icon: 'zetaapi',
  },
  {
    key: 'opencode-teamorouter', name: 'TeamoRouter', backendId: 'opencode',
    websiteUrl: 'https://teamorouter.com',
    endpoint: 'https://api.teamorouter.com/v1',
    models: ['gpt-5.5'],
    category: 'aggregator', isPartner: true, icon: 'teamorouter',
  },
  {
    key: 'opencode-code0', name: 'Code0', backendId: 'opencode',
    websiteUrl: 'https://code0.ai',
    endpoint: 'https://code0.ai/v1',
    models: ['gpt-5.5'],
    category: 'aggregator', isPartner: true, icon: 'code0',
  },
  {
    key: 'opencode-nekocode', name: 'NekoCode', backendId: 'opencode',
    websiteUrl: 'https://nekocode.ai',
    endpoint: 'https://nekocode.ai/v1',
    models: ['gpt-5.5'],
    category: 'aggregator', isPartner: true, icon: 'nekocode',
  },
  {
    key: 'opencode-deepseek', name: 'DeepSeek', backendId: 'opencode',
    websiteUrl: 'https://platform.deepseek.com',
    endpoint: 'https://api.deepseek.com',
    models: ['deepseek-v4-pro', 'deepseek-v4-flash'],
    category: 'cn_official', icon: 'deepseek', iconColor: '#1E88E5',
  },
]

/* ═══════════════════════════════════════════════
   OpenClaw 预设 (6 providers)
   ═══════════════════════════════════════════════ */
const openclawPresets: ProviderPreset[] = [
  {
    key: 'openclaw-shengsuanyun', name: 'Shengsuanyun', backendId: 'openclaw',
    websiteUrl: 'https://www.shengsuanyun.com/?from=CH_4HHXMRYF',
    endpoint: 'https://router.shengsuanyun.com/api',
    models: ['anthropic/claude-opus-4-8', 'anthropic/claude-sonnet-5'],
    category: 'aggregator', isPartner: true, icon: 'shengsuanyun',
  },
  {
    key: 'openclaw-huoshan', name: '火山Agentplan', backendId: 'openclaw',
    websiteUrl: 'https://www.volcengine.com/activity/codingplan',
    endpoint: 'https://ark.cn-beijing.volces.com/api/coding/v3',
    models: ['ark-code-latest'],
    category: 'cn_official', isPartner: true, icon: 'huoshan', iconColor: '#3370FF',
  },
  {
    key: 'openclaw-doubaoseed', name: 'DouBaoSeed', backendId: 'openclaw',
    websiteUrl: 'https://console.volcengine.com/ark',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3',
    models: ['doubao-seed-2-1-pro-260628'],
    category: 'cn_official', isPartner: true, icon: 'doubao', iconColor: '#3370FF',
  },
  {
    key: 'openclaw-openrouter', name: 'OpenRouter', backendId: 'openclaw',
    websiteUrl: 'https://openrouter.ai',
    apiKeyUrl: 'https://openrouter.ai/keys',
    endpoint: 'https://openrouter.ai/api/v1',
    models: ['anthropic/claude-opus-4-8', 'anthropic/claude-sonnet-5'],
    category: 'aggregator', icon: 'openrouter', iconColor: '#6366F1',
  },
  {
    key: 'openclaw-deepseek', name: 'DeepSeek', backendId: 'openclaw',
    websiteUrl: 'https://platform.deepseek.com',
    endpoint: 'https://api.deepseek.com',
    models: ['deepseek-v4-pro', 'deepseek-v4-flash'],
    category: 'cn_official', icon: 'deepseek', iconColor: '#1E88E5',
  },
  {
    key: 'openclaw-zhipu', name: 'Zhipu GLM', backendId: 'openclaw',
    websiteUrl: 'https://open.bigmodel.cn',
    endpoint: 'https://open.bigmodel.cn/api/coding/paas/v4',
    models: ['glm-5.2'],
    category: 'cn_official', icon: 'zhipu', iconColor: '#0F62FE',
  },
]

/* ═══════════════════════════════════════════════
   汇总导出
   ═══════════════════════════════════════════════ */

/** 所有预设，按 backend 分组 */
export const ALL_PRESETS: Record<BackendId, ProviderPreset[]> = {
  'claude': claudePresets,
  'claude-desktop': claudePresets.slice(0, 10), // Claude Desktop 复用前10个Claude预设
  'codex': codexPresets,
  'gemini': geminiPresets,
  'hermes': hermesPresets,
  'opencode': opencodePresets,
  'openclaw': openclawPresets,
}

/** 获取某个 backend 的预设列表 */
export function getPresetsForBackend(bid: BackendId): ProviderPreset[] {
  return ALL_PRESETS[bid] ?? []
}

/** 按 key 查找预设 */
export function findPresetByKey(key: string): ProviderPreset | undefined {
  for (const presets of Object.values(ALL_PRESETS)) {
    const found = presets.find((p) => p.key === key)
    if (found) return found
  }
  return undefined
}

/** 从预设创建 ProviderConfig */
export function presetToProvider(
  preset: ProviderPreset,
  apiKey: string = '',
  customName?: string,
): Omit<import('../stores/settingsStore').ProviderConfig, 'id' | 'createdAt'> {
  return {
    backendId: preset.backendId,
    name: customName ?? preset.name,
    apiKey,
    endpoint: preset.endpoint,
    models: preset.models,
    enabled: true,
    category: preset.category,
    websiteUrl: preset.websiteUrl,
    apiKeyUrl: preset.apiKeyUrl,
    icon: preset.icon,
    iconColor: preset.iconColor,
    isPartner: preset.isPartner,
    isOfficial: preset.isOfficial,
    presetKey: preset.key,
    meta: {
      apiFormat: preset.apiFormat,
      endpointCandidates: preset.endpointCandidates,
    },
  }
}

/** MCP 预设 (5个常用 MCP 服务器) */
export interface McpPreset {
  id: string
  name: string
  tags: string[]
  type: 'stdio'
  command: string
  args: string[]
  homepage?: string
  docs?: string
  description?: string
}

export const MCP_PRESETS: McpPreset[] = [
  {
    id: 'fetch', name: 'mcp-server-fetch',
    tags: ['stdio', 'http', 'web'],
    type: 'stdio', command: 'uvx', args: ['mcp-server-fetch'],
    homepage: 'https://github.com/modelcontextprotocol/servers',
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch',
    description: 'Web 内容获取和 HTML 解析',
  },
  {
    id: 'time', name: '@modelcontextprotocol/server-time',
    tags: ['stdio', 'time', 'utility'],
    type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-time'],
    homepage: 'https://github.com/modelcontextprotocol/servers',
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/time',
    description: '时间和时区查询',
  },
  {
    id: 'memory', name: '@modelcontextprotocol/server-memory',
    tags: ['stdio', 'memory', 'graph'],
    type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-memory'],
    homepage: 'https://github.com/modelcontextprotocol/servers',
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
    description: '知识图谱记忆系统',
  },
  {
    id: 'sequential-thinking', name: '@modelcontextprotocol/server-sequential-thinking',
    tags: ['stdio', 'thinking', 'reasoning'],
    type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
    homepage: 'https://github.com/modelcontextprotocol/servers',
    docs: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking',
    description: '顺序思考推理引擎',
  },
  {
    id: 'context7', name: '@upstash/context7-mcp',
    tags: ['stdio', 'docs', 'search'],
    type: 'stdio', command: 'npx', args: ['-y', '@upstash/context7-mcp'],
    homepage: 'https://context7.com',
    docs: 'https://github.com/upstash/context7/blob/master/README.md',
    description: 'Context7 实时文档查询',
  },
]
