# Ollama Model Research - March 2026
## Comprehensive Guide for Model Recommendation Engine

**Research Date:** March 24, 2026
**Data Sources:** Ollama Library (ollama.com/library), LMSYS Chatbot Arena, benchmark papers, r/LocalLLaMA community consensus, manufacturer technical reports

---

## TABLE OF CONTENTS

1. [Hardware Reference](#hardware-reference)
2. [Top 20 Ranked Models](#top-20-ranked-models)
3. [Detailed Model Profiles](#detailed-model-profiles)
4. [Category Winners](#category-winners)
5. [Beginner Decision Matrix](#beginner-decision-matrix)
6. [Models NOT Recommended](#models-not-recommended)

---

## HARDWARE REFERENCE

Quick reference for what runs on what hardware:

| System RAM/VRAM | Max Model Size | Example Models |
|----------------|---------------|----------------|
| 8 GB | ~3-4B params | phi4-mini (3.8B), gemma3n:e2b, qwen3:4b |
| 16 GB | ~8-9B params | qwen3.5:9b, llama3.1:8b, gemma3:4b |
| 32 GB | ~14-27B params | qwen3.5:27b, gemma3:27b, mistral-small3.1:24b |
| 48 GB | ~32-35B params | qwen3:32b, deepseek-r1:32b, command-r:35b |
| 64 GB+ | ~70B params | llama3.3:70b, deepseek-r1:70b |
| 96 GB+ / Multi-GPU | 120B+ | gpt-oss:120b, llama4:16x17b |

**Note:** All sizes assume Q4_K_M quantization (the Ollama default), which compresses weights to ~4 bits. This is the recommended starting point for quality vs. memory tradeoff.

---

## TOP 20 RANKED MODELS

Ranked by overall value to a beginner user (balancing quality, versatility, hardware accessibility, and community support).

### Tier 1: "Must-Have" Models

| # | Ollama Tag | Params | Download | Context | Best For | Cloud Equivalent | Pulls |
|---|-----------|--------|----------|---------|----------|-----------------|-------|
| 1 | `qwen3.5:9b` | 9B | 6.6 GB | 256K | All-rounder, multimodal | ~GPT-4o-mini | 3.1M |
| 2 | `qwen3:8b` | 8B | 5.2 GB | 40K | Coding, reasoning | ~GPT-4o-mini | 24.8M |
| 3 | `deepseek-r1:8b` | 8B (distilled) | 5.2 GB | 128K | Reasoning, math | ~o1-mini (distilled) | 80.8M |
| 4 | `gemma3:4b` | 4B | 3.3 GB | 128K | Small all-rounder, multimodal | Above Gemini 1.5 Flash | 34.1M |
| 5 | `llama3.1:8b` | 8B | 4.9 GB | 128K | General assistant, ecosystem | ~GPT-3.5+ | 111.9M |

### Tier 2: Specialists & Power Users

| # | Ollama Tag | Params | Download | Context | Best For | Cloud Equivalent | Pulls |
|---|-----------|--------|----------|---------|----------|-----------------|-------|
| 6 | `qwen3.5:27b` | 27B | 17 GB | 256K | Coding beast, multimodal | ~GPT-4o (coding) | 3.1M |
| 7 | `gpt-oss:20b` | 20B (MoE) | 14 GB | 128K | Reasoning, tool use | ~o3-mini | 8.1M |
| 8 | `phi4-mini:3.8b` | 3.8B | 2.5 GB | 128K | Math, reasoning (tiny) | Beats GPT-4o on math | 990K |
| 9 | `mistral-small3.1:24b` | 24B | 15 GB | 128K | Vision, function calling | ~GPT-4o-mini + vision | 664K |
| 10 | `qwen3-coder:30b` | 30B (3.3B active) | 19 GB | 256K | Agentic coding | Near Claude Sonnet (code) | 4M |

### Tier 3: Niche Excellence

| # | Ollama Tag | Params | Download | Context | Best For | Cloud Equivalent | Pulls |
|---|-----------|--------|----------|---------|----------|-----------------|-------|
| 11 | `devstral:24b` | 24B | 14 GB | 128K | SWE-bench coding agents | Best OSS SWE-bench | 854K |
| 12 | `cogito:8b` | 8B | 4.9 GB | 128K | Hybrid reasoning, multilingual | Beats Llama 3.1 8B | 1.7M |
| 13 | `glm-4.7-flash` | 30B (3B active) | 19 GB | 198K | Coding, agentic tool use | Near GPT-4o (code) | 866K |
| 14 | `magistral:24b` | 24B | 14 GB | 39K | Chain-of-thought reasoning | ~o1-mini | 1.2M |
| 15 | `llama3.3:70b` | 70B | 43 GB | 128K | Best large open model | ~GPT-4 (original) | 3.5M |

### Tier 4: Specialized / Emerging

| # | Ollama Tag | Params | Download | Context | Best For | Cloud Equivalent | Pulls |
|---|-----------|--------|----------|---------|----------|-----------------|-------|
| 16 | `exaone-deep:32b` | 32B | 20 GB | 128K | Math olympiad reasoning | Beats o1-mini (math) | 606K |
| 17 | `gemma3n:e4b` | ~5B (4B effective) | 7.5 GB | 32K | On-device, ultra-efficient | Phone-grade AI | 1.4M |
| 18 | `qwen3-coder-next` | 80B (3B active) | 52 GB | 256K | Extreme agentic coding | Near Claude Sonnet (agentic) | 901K |
| 19 | `aya-expanse:8b` | 8B | 4.9 GB | 128K | Multilingual (23 langs) | Best OSS multilingual 8B | 603K |
| 20 | `llama4:16x17b` | 109B (17B active) | 67 GB | 10M | Multimodal, long context | ~GPT-4o (vision) | 1.4M |

---

## DETAILED MODEL PROFILES

---

### 1. QWEN 3.5

**Ollama tag:** `qwen3.5`
**Developer:** Alibaba (Qwen Team)
**Released:** February 2026
**Total Ollama pulls:** 3.1M

#### Available Sizes
| Tag | Params | Download | Context | Multimodal |
|-----|--------|----------|---------|------------|
| `qwen3.5:0.8b` | 0.8B | 1.0 GB | 256K | Yes (text+image) |
| `qwen3.5:2b` | 2B | 2.7 GB | 256K | Yes |
| `qwen3.5:4b` | 4B | 3.4 GB | 256K | Yes |
| `qwen3.5:9b` | 9B | 6.6 GB | 256K | Yes |
| `qwen3.5:27b` | 27B | 17 GB | 256K | Yes |
| `qwen3.5:35b` | 35B | 24 GB | 256K | Yes |
| `qwen3.5:122b` | 122B | 81 GB | 256K | Yes |

#### Benchmark Scores (27B)
- **MMLU-Pro:** 86.1
- **GPQA Diamond:** 85.5
- **SWE-bench Verified:** 72.4 (GPT-5 Mini range)
- **HumanEval:** ~87-88 (estimated, competitive with Gemma 3 27B)
- **GSM8K:** ~95+ (competitive)

#### Best For
- **All-rounder:** Strong across coding, math, reasoning, conversation
- **Multimodal:** Native vision capability in all sizes
- **Long context:** 256K native context window
- **Coding:** 27B hits 72.4% SWE-bench (rivals frontier models)
- **Multilingual:** Excellent CJK + strong English

#### Known Weaknesses
- Newer model, smaller community fine-tune ecosystem than Llama
- English-language documentation still catching up
- 35B and 122B sizes require significant hardware

#### Community Consensus (r/LocalLLaMA)
The 9B is widely considered the best "bang for buck" small model as of early 2026. The 27B is considered the single best model for coding under 30B. Community treats this as the default recommendation for anyone with 16-32GB RAM.

---

### 2. QWEN 3

**Ollama tag:** `qwen3`
**Developer:** Alibaba (Qwen Team)
**Released:** May 2025
**Total Ollama pulls:** 24.8M

#### Available Sizes
| Tag | Params | Download | Context |
|-----|--------|----------|---------|
| `qwen3:0.6b` | 0.6B | 523 MB | 40K |
| `qwen3:1.7b` | 1.7B | 1.4 GB | 40K |
| `qwen3:4b` | 4B | 2.5 GB | 256K |
| `qwen3:8b` | 8B | 5.2 GB | 40K |
| `qwen3:14b` | 14B | 9.3 GB | 40K |
| `qwen3:30b` | 30B (MoE) | 19 GB | 256K |
| `qwen3:32b` | 32B | 20 GB | 40K |
| `qwen3:235b` | 235B (MoE) | 142 GB | 256K |

#### Benchmark Scores
- **Qwen3-4B** rivals Qwen2.5-72B performance (massive efficiency gain)
- **MMLU:** 14B=81.05, 32B=83.32
- **MATH:** 14B=62.02
- **HumanEval/EvalPlus:** 14B=72.23, 32B=66.25
- Crushed coding (HumanEval, MBPP), math (GSM8K, MATH), multilingual benchmarks

#### Best For
- **Coding:** Qwen3 7/8B posts highest HumanEval (76.0) of any sub-8B model
- **Reasoning:** Strong hybrid thinking mode
- **Small model efficiency:** 4B model punches at 72B weight class
- **Multilingual:** Best CJK support in open models

#### Known Weaknesses
- 40K context on most sizes (except 4B, 30B, 235B which get 256K)
- Superseded by Qwen 3.5 for multimodal tasks
- Some quantization sensitivity reported at small sizes

#### Community Consensus
"The Qwen3 8B is the coding king at its size class." Widely recommended for developers. The 4B model is considered a miracle of efficiency. Still very actively used despite Qwen 3.5 release.

---

### 3. DEEPSEEK R1

**Ollama tag:** `deepseek-r1`
**Developer:** DeepSeek (China)
**Released:** January 2025 (0528 update: May 2025)
**Total Ollama pulls:** 80.8M

#### Available Sizes
| Tag | Params | Download | Context | Notes |
|-----|--------|----------|---------|-------|
| `deepseek-r1:1.5b` | 1.5B (distilled) | 1.1 GB | 128K | Distilled from Qwen |
| `deepseek-r1:7b` | 7B (distilled) | 4.7 GB | 128K | Distilled from Qwen |
| `deepseek-r1:8b` | 8B (distilled) | 5.2 GB | 128K | Distilled from Llama |
| `deepseek-r1:14b` | 14B (distilled) | 9.0 GB | 128K | Distilled from Qwen |
| `deepseek-r1:32b` | 32B (distilled) | 20 GB | 128K | Distilled from Qwen |
| `deepseek-r1:70b` | 70B (distilled) | 43 GB | 128K | Distilled from Llama |
| `deepseek-r1:671b` | 671B (full) | 404 GB | 160K | Full MoE model |

#### Benchmark Scores
- **MATH-500:** 94.5 (70B distilled), 83.9 (1.5B distilled)
- **AIME 2024:** 86.7 (70B), 28.9 (1.5B -- still beats GPT-4o!)
- **LiveCodeBench:** 57.5 (full model)
- **CodeForces Rating:** 1633
- Matches or exceeds GPT-4o on math and coding at fraction of cost

#### Best For
- **Mathematical reasoning:** Best-in-class chain-of-thought math solving
- **Complex reasoning:** Shows full thinking process with step-by-step traces
- **Code problem-solving:** Strong competitive programming performance
- **Learning:** Transparent reasoning traces excellent for understanding AI thinking

#### Known Weaknesses
- SLOW: ~850ms latency vs ~232ms for GPT-4o (shows all thinking steps)
- Verbose outputs (thinking traces add tokens)
- Distilled models lose significant capability vs full 671B
- 671B full model requires enterprise hardware (400+ GB)
- Weaker at creative writing and casual conversation
- Language mixing issues in some distilled variants

#### Community Consensus
"For anything requiring careful reasoning, DeepSeek-R1 is the better choice." The 32B distilled is considered the sweet spot. The 8B is popular for its surprising reasoning at small size. Many users report it "overthinks" simple questions.

---

### 4. GEMMA 3

**Ollama tag:** `gemma3`
**Developer:** Google DeepMind
**Released:** March 2025
**Total Ollama pulls:** 34.1M

#### Available Sizes
| Tag | Params | Download | Context | Multimodal |
|-----|--------|----------|---------|------------|
| `gemma3:270m` | 270M | 292 MB | 32K | No |
| `gemma3:1b` | 1B | 815 MB | 32K | No |
| `gemma3:4b` | 4B | 3.3 GB | 128K | Yes (text+image) |
| `gemma3:12b` | 12B | 8.1 GB | 128K | Yes |
| `gemma3:27b` | 17 GB | 128K | Yes |

Also available: QAT (Quantization-Aware Trained) variants that preserve BF16 quality at 3x less memory.

#### Benchmark Scores (27B)
- **MMLU-Pro:** 67.5
- **MATH:** 69.0
- **GPQA Diamond:** 42.4
- **GSM8K:** 89%+
- **HumanEval/MBPP:** 56%+ pass rates
- 4B-IT outperforms much larger Gemma2-27B on STEM, math, code, reasoning

#### Best For
- **Multimodal vision:** Native image understanding from 4B up
- **On-device deployment:** QAT models run excellently on consumer hardware
- **Balanced general use:** Strong across all categories without dominating any
- **Google ecosystem:** Well-supported, frequent updates, excellent docs

#### Known Weaknesses
- Coding benchmarks lag behind Qwen 3 and Llama 3.3 at equivalent sizes
- MMLU-Pro (67.5) notably lower than Qwen 3.5 (86.1) at 27B
- Creative writing considered average by community
- Gemma 3 270M is extremely limited (mostly for embedding-like tasks)

#### Community Consensus
"Most capable model you can run on a single GPU" is Google's claim, and the community largely agrees for vision tasks. The 4B is a "Swiss army knife" -- good at everything, great at nothing. The 27B is respected but overshadowed by Qwen 3.5 27B on pure benchmarks. QAT models praised for quality-at-size.

---

### 5. LLAMA 3.1 / 3.2 / 3.3

**Developer:** Meta
**Combined Ollama pulls:** 177M+

#### Llama 3.1
| Tag | Params | Download | Context |
|-----|--------|----------|---------|
| `llama3.1:8b` | 8B | 4.9 GB | 128K |
| `llama3.1:70b` | 70B | 43 GB | 128K |
| `llama3.1:405b` | 405B | 243 GB | 128K |

#### Llama 3.2
| Tag | Params | Download | Context |
|-----|--------|----------|---------|
| `llama3.2:1b` | 1B | 1.3 GB | 128K |
| `llama3.2:3b` | 3B | 2.0 GB | 128K |

#### Llama 3.3
| Tag | Params | Download | Context |
|-----|--------|----------|---------|
| `llama3.3:70b` | 70B | 43 GB | 128K |

#### Benchmark Scores (3.3 70B)
- **HumanEval:** 88.4 (better than GPT-4o)
- **MATH:** 77.0 (on par with GPT-4o's 76.9)
- **MMLU:** Competitive but below GPT-4o
- **GPQA Diamond:** 56% (GPT-4o: 69%)
- 70B described as "Llama 3.1 405B equivalent performance"

#### Best For
- **Largest ecosystem:** Most fine-tunes, most community support, most documentation
- **General assistant:** Excellent conversational AI
- **Llama 3.3 70B:** Best large open model for coding locally on Mac (64GB+)
- **Llama 3.2 1B/3B:** Best for truly constrained devices

#### Known Weaknesses
- 3.1 8B outperformed by Qwen3 8B on coding benchmarks
- No multimodal in text-only variants (separate llama3.2-vision exists)
- 3.3 only available at 70B (no small 3.3 variant)
- English-centric (8 languages vs Qwen's broader multilingual)

#### Community Consensus
"The community ecosystem is unmatched." Llama remains the default recommendation for beginners because of documentation quality, fine-tune availability, and tooling support. However, pure benchmark chasers are moving to Qwen. "Llama 3.3 70B on a Mac with 64GB is GPT-4-class coding locally."

---

### 6. GPT-OSS (OpenAI Open Source)

**Ollama tag:** `gpt-oss`
**Developer:** OpenAI
**Released:** ~September 2025
**Total Ollama pulls:** 8.1M

#### Available Sizes
| Tag | Params | Download | Context |
|-----|--------|----------|---------|
| `gpt-oss:20b` | 20B (MoE) | 14 GB | 128K |
| `gpt-oss:120b` | 120B (MoE) | 65 GB | 128K |

#### Benchmark Scores
- **gpt-oss-120b:** Matches or surpasses o4-mini on AIME, MMLU, TauBench, HealthBench
- **gpt-oss-20b:** Matches o3-mini in reasoning, math, and health tasks
- Outperforms OpenAI o1 and GPT-4o (proprietary) on some benchmarks

#### Best For
- **Reasoning with transparency:** Configurable reasoning effort (low/medium/high)
- **Function calling/tool use:** Native support
- **Structured outputs:** Built-in JSON mode
- **OpenAI pedigree:** Same training methodology as GPT-4/5 series

#### Known Weaknesses
- Relatively new, smaller community vs Llama/Qwen
- 20B requires 16GB+ RAM (MoE architecture)
- Less multilingual than Qwen
- No vision/multimodal

#### Community Consensus
"Finally, OpenAI gave us something real." The 20B is praised for fitting in 16GB while delivering o3-mini reasoning. The 120B is considered the best reasoning model you can run locally if you have the hardware. License is Apache 2.0 -- genuinely open.

---

### 7. PHI-4 MINI

**Ollama tag:** `phi4-mini`
**Developer:** Microsoft
**Released:** March 2025
**Total Ollama pulls:** 990K

#### Available Sizes
| Tag | Params | Download | Context |
|-----|--------|----------|---------|
| `phi4-mini:3.8b` | 3.8B | 2.5 GB | 128K |

Also see: `phi4:14b` (9.1 GB, 16K context) and `phi4-reasoning:14b` for reasoning variant

#### Benchmark Scores (phi4-mini-reasoning variant)
- **MATH-500:** 94.6 (nearly matches o1-mini's 90%!)
- **AIME 2024:** 57.5 (up from base model's 10%)
- **GPQA Diamond:** 52% (outperforms models 2x its size)
- **LiveCodeBench:** 25%+ point improvement over base
- Beats DeepSeek 7B and 8B on several math benchmarks

#### Best For
- **Math reasoning:** Absurd math performance for 3.8B model
- **8GB hardware:** Only viable high-quality option for 8GB machines
- **Multilingual:** Enhanced multilingual in phi4-mini
- **Function calling:** Newly added capability

#### Known Weaknesses
- Not great at creative writing or long-form generation
- Knowledge cutoff can feel dated for general questions
- 128K context impressive but model struggles with very long inputs in practice
- Phi4 14B only has 16K context (much less than competitors)

#### Community Consensus
"Phi-4-mini beats GPT-4o on math. At 3.8 billion parameters. Let that sink in." The community loves this model for anyone on constrained hardware. The only real competitor at this size is Gemma 3 1B (which is less capable) or Qwen3 4B (which needs slightly more RAM).

---

### 8. MISTRAL SMALL 3.1

**Ollama tag:** `mistral-small3.1`
**Developer:** Mistral AI
**Released:** March 2025
**Total Ollama pulls:** 664K

#### Available Sizes
| Tag | Params | Download | Context | Multimodal |
|-----|--------|----------|---------|------------|
| `mistral-small3.1:24b` | 24B | 15 GB | 128K | Yes (text+image) |

Also see: `mistral-small3.2:24b` (improved function calling)

#### Benchmark Scores
- Outperforms Gemma 3 and GPT-4o Mini
- 150 tokens/second inference speed
- Best-in-class agentic/function calling capabilities
- Strong vision understanding added to Small 3.1

#### Best For
- **Vision + text in one model:** Native multimodal at 24B
- **Function calling/tool use:** State-of-the-art for agentic workflows
- **Speed:** 150 tok/s is very fast for 24B model
- **Enterprise:** Apache 2.0, runs on single RTX 4090 or 32GB Mac

#### Known Weaknesses
- Reasoning/coding benchmarks are "modest" vs Qwen 3.5 and DeepSeek
- 32K effective context (128K claimed but less reliable at full length)
- Vision quality trails dedicated vision models
- Overtaken by newer Mistral models (Small 3.2, Mistral Large 3)

#### Community Consensus
"Jack of all trades at 24B with real vision." Praised for function calling and speed. Not the benchmark king but very practical. The community recommends it for developers building tool-using AI agents.

---

### 9. DEVSTRAL

**Ollama tag:** `devstral`
**Developer:** Mistral AI
**Released:** May 2025
**Total Ollama pulls:** 854K

#### Available Sizes
| Tag | Params | Download | Context |
|-----|--------|----------|---------|
| `devstral:24b` | 24B | 14 GB | 128K |

Also see: `devstral-small-2:24b` (683K pulls) and `devstral-2:123b` (144K pulls)

#### Benchmark Scores
- **SWE-bench Verified:** 46.8 (original), improved in later versions
- Outperforms DeepSeek-V3-0324 (671B) on SWE-bench despite being 20x smaller
- Fine-tuned from Mistral Small 3.1 specifically for coding agents

#### Best For
- **Coding agents:** Purpose-built for SWE-bench style tasks
- **Multi-file editing:** Trained specifically on codebase exploration
- **Tool use for code:** Best open-source model for IDE-like coding agents
- **Local deployment:** Runs on RTX 4090 or 32GB Mac

#### Known Weaknesses
- Code-only specialist -- poor at general conversation
- 24B original model superseded by devstral-small-2 and devstral-2
- Not multimodal
- Community reports it can be "stubborn" about code formatting preferences

#### Community Consensus
"The best open source model for coding agents, period." Widely used for AI-powered IDE extensions. Devstral-2 (123B) is considered even better but requires serious hardware.

---

### 10. COGITO

**Ollama tag:** `cogito`
**Developer:** Deep Cogito
**Released:** April 2025 (v2.1: November 2025)
**Total Ollama pulls:** 1.7M

#### Available Sizes
| Tag | Params | Download | Context |
|-----|--------|----------|---------|
| `cogito:3b` | 3B | 2.2 GB | 128K |
| `cogito:8b` | 8B | 4.9 GB | 128K |
| `cogito:14b` | 14B | 9.0 GB | 128K |
| `cogito:32b` | 32B | 20 GB | 128K |
| `cogito:70b` | 70B | 43 GB | 128K |

#### Benchmark Scores
- Outperforms Llama 3.1/3.2/3.3 and Qwen 2.5 at equivalent sizes
- 70B outperforms Llama 4 109B MoE in reasoning mode
- Hybrid reasoning: can answer directly OR self-reflect before answering
- Trained using Iterated Distillation and Amplification (IDA)

#### Best For
- **Hybrid reasoning:** Toggle between fast direct answers and deep reasoning
- **Coding + STEM:** Optimized for technical tasks
- **Tool calling:** Strong function calling support
- **Multilingual:** 30+ languages supported

#### Known Weaknesses
- Smaller community than Llama/Qwen
- Based on Llama/Qwen checkpoints (not fully original architecture)
- Self-reflection mode adds latency
- Less tested in production compared to tier-1 models

#### Community Consensus
"A hidden gem." Users praise the hybrid reasoning mode. The 8B variant is considered better than Llama 3.1 8B across the board. Growing community but not yet mainstream.

---

### 11. GLM-4.7-FLASH

**Ollama tag:** `glm-4.7-flash`
**Developer:** Z.AI / THUDM (Tsinghua University)
**Released:** February 2026
**Total Ollama pulls:** 866K

#### Available Sizes
| Tag | Params | Download | Context |
|-----|--------|----------|---------|
| `glm-4.7-flash:q4_K_M` | 30B (3B active MoE) | 19 GB | 198K |
| `glm-4.7-flash:q8_0` | 30B (3B active) | 32 GB | 198K |
| `glm-4.7-flash:bf16` | 30B (3B active) | 60 GB | 198K |

#### Benchmark Scores
- **SWE-bench Verified:** 59.2
- **AIME 2025:** Beats Qwen 3.5 by 2.6 points on pure math
- **TAU2-Bench:** 79.5 (agentic tool use)
- Dominates with 30.1 Intelligence Index
- On complex coding (master-level), ELO 1572 vs Qwen 3.5's 1194

#### Best For
- **Developer coding:** Invested heavily in coding capability
- **Agentic tool use:** Near state-of-the-art tool calling
- **Math:** Surprisingly strong math reasoning
- **Efficient inference:** Only 3B active params from 30B total

#### Known Weaknesses
- MMLU-Pro ~60 (far below Qwen's 85.3) -- weaker general knowledge
- Requires Ollama pre-release version (0.14.3+)
- Limited English community presence
- Narrow focus: great at code/tools, mediocre at general chat

#### Community Consensus
"Punches far above its weight class on developer tasks." Praised by Chinese dev community, growing internationally. "Z.AI clearly invested heavily in coding at the expense of broad knowledge benchmarks."

---

### 12. MAGISTRAL

**Ollama tag:** `magistral`
**Developer:** Mistral AI
**Released:** June 2025 (v1.2: September 2025)
**Total Ollama pulls:** 1.2M

#### Available Sizes
| Tag | Params | Download | Context |
|-----|--------|----------|---------|
| `magistral:24b` | 24B | 14 GB | 39K (degrades past 40K) |

#### Benchmark Scores
- **AIME 2024:** 70.7% (83.3% with majority voting)
- v1.2 shows 15% improvement on math and coding vs v1.0
- Chain-of-thought reasoning specialist

#### Best For
- **Math reasoning:** Dedicated reasoning model
- **Chain-of-thought:** Transparent reasoning traces
- **Financial/legal analysis:** Strong domain reasoning
- **Apache 2.0:** Fully open for commercial use

#### Known Weaknesses
- Short context (39K, degrades past 40K)
- Not multimodal
- Narrow specialist -- poor at casual conversation
- Superseded by newer reasoning models (gpt-oss, DeepSeek R1)

---

### 13. EXAONE DEEP

**Ollama tag:** `exaone-deep`
**Developer:** LG AI Research
**Released:** March 2025
**Total Ollama pulls:** 606K

#### Available Sizes
| Tag | Params | Download | Context |
|-----|--------|----------|---------|
| `exaone-deep:2.4b` | 2.4B | ~1.5 GB | 128K |
| `exaone-deep:7.8b` | 7.8B | ~4.8 GB | 128K |
| `exaone-deep:32b` | 32B | ~20 GB | 128K |

#### Benchmark Scores
- **MATH-500:** 32B=94.5, 7.8B=94.8, 2.4B=92.3
- **AIME 2024:** 32B=90.0, 7.8B=59.6, 2.4B=47.9
- **AIME 2025:** 32B keeps pace with DeepSeek-R1 671B
- 7.8B outperforms o1-mini

#### Best For
- **Math olympiad:** Insane math performance at small sizes
- **Scientific reasoning:** Strong STEM focus
- **Efficient reasoning:** 7.8B beats o1-mini

#### Known Weaknesses
- Narrow specialist (math/science focused)
- Smaller community
- Limited creative/conversation capability
- Korean-centric training may affect English nuance

---

### 14. LLAMA 4

**Ollama tag:** `llama4`
**Developer:** Meta
**Released:** April 2025
**Total Ollama pulls:** 1.4M

#### Available Sizes
| Tag | Params (Active) | Download | Context | Multimodal |
|-----|--------|----------|---------|------------|
| `llama4:16x17b` (Scout) | 109B (17B active) | 67 GB | 10M | Yes (text+image) |
| `llama4:128x17b` (Maverick) | 400B (17B active) | 245 GB | 1M | Yes |

#### Benchmark Scores
- **MMMU:** Scout=69.4, Maverick=73.4
- **MathVista:** Scout=70.7, Maverick=73.7
- **LiveCodeBench:** Scout=32.8, Maverick=43.4
- **GPQA Diamond:** Maverick=80.5
- Scout beats Gemma 3, Gemini 2.0 Flash-Lite, Mistral 3.1

#### Best For
- **10 million token context:** Scout's unmatched context window
- **Multimodal:** Native image understanding
- **Multilingual:** 12 languages supported

#### Known Weaknesses
- Scout (67GB) requires 64GB+ RAM -- not beginner friendly
- Maverick (245GB) requires multi-GPU setup
- Community reports underwhelming performance vs Llama 3.3 70B on text-only tasks
- MoE architecture means actual quality per-token is 17B level
- LiveCodeBench scores (32.8-43.4) significantly trail Qwen 3.5 and DeepSeek

#### Community Consensus
Mixed reception. "If you need 10M context or vision, it's the only game in town at this price. For everything else, Llama 3.3 70B is still better." The community is waiting for Llama 4.1 to address text quality.

---

### 15. COMMAND R / COMMAND R+

**Ollama tag:** `command-r`, `command-r-plus`
**Developer:** Cohere
**Total Ollama pulls:** 993K (R) + 548K (R+)

#### Available Sizes
| Tag | Params | Download | Context |
|-----|--------|----------|---------|
| `command-r:35b` | 35B | 19 GB | 128K |
| `command-r-plus` | 104B | ~60 GB | 128K |
| `command-r7b` | 7B | ~4.5 GB | 128K |

#### Best For
- **RAG (Retrieval-Augmented Generation):** Purpose-built for RAG workflows
- **Enterprise document Q&A:** Optimized for long context retrieval
- **Tool use:** Strong function calling
- **10 languages:** Solid multilingual support

#### Known Weaknesses
- Outperformed by newer models (Qwen 3.5, gpt-oss) on general benchmarks
- 35B is large for what it delivers vs Qwen 3.5 27B
- Less community activity than Llama/Qwen
- Not multimodal (text only)

#### Community Consensus
"Still the best for RAG if that's your primary use case." However, many users have migrated to Qwen3.5 or gpt-oss for general purpose. Command R7B praised as a fast, capable small model.

---

### 16. QWEN3-CODER / QWEN3-CODER-NEXT

**Ollama tags:** `qwen3-coder`, `qwen3-coder-next`
**Developer:** Alibaba (Qwen Team)
**Total Ollama pulls:** 4M + 901K

#### Available Sizes
| Tag | Params (Active) | Download | Context |
|-----|--------|----------|---------|
| `qwen3-coder:30b` | 30B (3.3B active) | 19 GB | 256K |
| `qwen3-coder:480b` | 480B | 290 GB | 256K |
| `qwen3-coder-next` | 80B (3B active) | 52 GB | 256K |

#### Benchmark Scores
- **qwen3-coder SWE-bench Verified:** 69.6 (surpasses Claude and GPT-4)
- **qwen3-coder-next SWE-bench Verified:** 70.6
- **qwen3-coder-next SWE-bench Multilingual:** 62.8
- **qwen3-coder-next SWE-bench Pro:** 44.3
- Trained on 7.5 trillion tokens (70% code)

#### Best For
- **Agentic coding:** Best open-source model for coding agent workflows
- **Repository-scale understanding:** 256K context handles full repos
- **Multi-file editing:** Trained on environment interaction
- **Long coding sessions:** Handles up to 300 agentic turns

#### Known Weaknesses
- qwen3-coder-next (52GB) requires significant hardware
- Code-specialist: not designed for general conversation
- Non-thinking mode only (no chain-of-thought traces)
- 480B variant requires 250GB+ memory

#### Community Consensus
"Qwen3-Coder is the most capable agentic coding model available in open source." The 30B variant with 3.3B active is praised for efficiency. Coder-Next at 3B active gives "insane throughput for repo-level tasks."

---

### 17. FALCON 3

**Ollama tag:** `falcon3`
**Developer:** Technology Innovation Institute (TII)
**Total Ollama pulls:** 2.3M

#### Available Sizes
| Tag | Params | Download | Context |
|-----|--------|----------|---------|
| `falcon3:1b` | 1B | 1.8 GB | 8K |
| `falcon3:3b` | 3B | 2.0 GB | 32K |
| `falcon3:7b` | 7B | 4.6 GB | 32K |
| `falcon3:10b` | 10B | 6.3 GB | 32K |

#### Best For
- **Science/math/coding:** Focused training on STEM
- **Under-13B performance:** 10B is state-of-the-art in size class (at release)

#### Known Weaknesses
- Overshadowed by Qwen3 and Gemma3 in 2026
- 8K context on 1B model is very limiting
- Small community compared to major model families
- No multimodal capability

---

### 18. AYA EXPANSE

**Ollama tag:** `aya-expanse`
**Developer:** Cohere For AI
**Total Ollama pulls:** 603K

#### Available Sizes
| Tag | Params | Download | Context |
|-----|--------|----------|---------|
| `aya-expanse:8b` | 8B | ~4.9 GB | 128K |
| `aya-expanse:32b` | 32B | ~20 GB | 128K |

#### Benchmark Scores
- 76.6% win-rate vs Gemma 2, Qwen 2.5, Llama 3.1 on multilingual Arena-Hard-Auto
- 32B outperforms Llama 3.1 70B (2x params!) on multilingual tasks with 54% win-rate

#### Best For
- **Multilingual (23 languages):** Purpose-built for multilingual excellence
- **Non-English users:** Arabic, Chinese, Japanese, Korean, Hindi, and 18 more
- **Cross-lingual transfer:** Strong performance across all supported languages

#### Known Weaknesses
- English-only tasks: outperformed by Qwen3, Llama 3.3
- Smaller model ecosystem
- Not optimized for coding
- No multimodal

---

### 19. GEMMA 3N

**Ollama tag:** `gemma3n`
**Developer:** Google DeepMind
**Released:** June 2025
**Total Ollama pulls:** 1.4M

#### Available Sizes
| Tag | Effective Params | Download | Context | Multimodal |
|-----|--------|----------|---------|------------|
| `gemma3n:e2b` | 2B effective | 5.6 GB | 32K | Yes (text+image+audio+video) |
| `gemma3n:e4b` | 4B effective | 7.5 GB | 32K | Yes |

#### Benchmark Scores
- **HumanEval:** E2B=66.5%, E4B=75.0%
- 1.5x faster than Gemma 3 4B on mobile
- 2x faster inference than equivalent 4B models
- Runs with 2GB (E2B) or 3GB (E4B) memory footprint

#### Best For
- **Mobile/edge devices:** Designed for phones and tablets
- **Ultra-low resource:** 2-3GB memory footprint
- **Multimodal on device:** Image, audio, video understanding at tiny size
- **140+ languages:** Massive multilingual coverage

#### Known Weaknesses
- 32K context only
- Download sizes (5.6-7.5GB) are larger than memory footprint due to selective activation
- Quality trails Gemma 3 4B on complex tasks
- Newer model, less community validation

---

### 20. LFM2.5-THINKING

**Ollama tag:** `lfm2.5-thinking`
**Developer:** Liquid AI
**Released:** January 2026
**Total Ollama pulls:** 1M

#### Available Sizes
| Tag | Params | Download | Context |
|-----|--------|----------|---------|
| `lfm2.5-thinking` | 1.2B | <1 GB | 32K |

#### Benchmark Scores
- **MATH-500:** 88 (up from 63 for non-thinking variant)
- Competes with Qwen3-1.7B while using 40% fewer parameters
- Outperforms Granite-4.0-1B, Gemma-3-1B, Llama-3.2-1B
- 239 tok/s on AMD CPU, 82 tok/s on mobile NPU

#### Best For
- **Ultra-compact reasoning:** Sub-1GB model with real reasoning
- **On-device AI agents:** Optimized for phone/edge deployment
- **Speed:** 239 tokens/second on CPU
- **Agentic workflows:** Tool calling, data extraction, RAG

#### Known Weaknesses
- 1.2B params limits general knowledge significantly
- 32K context only
- Niche model -- not for general conversation
- Thinking traces consume extra tokens

---

## ADDITIONAL NOTABLE MODELS (Brief Profiles)

### Mixtral (`mixtral`)
- 8x7B or 8x22B MoE models by Mistral
- Older but still popular (2.2M pulls)
- Superseded by Mistral Small 3.x and gpt-oss for most use cases

### Hermes 3 (`hermes3`)
- Nous Research's flagship, based on Llama 3.1
- 8B to 405B sizes, 902K pulls
- Best for: roleplaying, agentic tasks, function calling
- Strong "uncensored" variant community

### Dolphin 3 (`dolphin3`)
- 3.7M pulls, based on Llama 3.1 8B
- Best for: uncensored/unrestricted generation
- Community-favorite for creative writing without guardrails

### WizardLM 2 (`wizardlm2`)
- Microsoft AI, 858K pulls
- Best for: improved reasoning, structured outputs
- Somewhat outdated in 2026

### StarCoder 2 (`starcoder2`)
- 3B/7B/15B code models, 2.4M pulls
- Best for: transparent code training, 80+ languages
- Superseded by Qwen3-Coder and Devstral for most users

### Codestral (`codestral`)
- Mistral's 22B code model, 999K pulls
- 80+ programming languages, fill-in-the-middle support
- Superseded by Devstral for coding agent tasks

### Mistral Nemo (`mistral-nemo`)
- 12B model by Mistral + NVIDIA, 3.6M pulls
- 128K context, good general purpose
- Superseded by Mistral Small 3.1/3.2

### Solar (`solar`)
- Upstage's 10.7B model, 607K pulls
- Good for single-turn conversation
- Outperformed by newer 8-14B models

### Yi (`yi`)
- 01.AI's bilingual models, 846K pulls
- Good Chinese-English bilingual performance
- Superseded by Qwen3 for bilingual tasks

### Kimi K2 (`kimi-k2`)
- Moonshot AI's 1T parameter MoE (32B active), 50.5K pulls
- **Cloud-only on Ollama** (no local download)
- SWE-bench 76.8-80.9%, agent swarm (100 sub-agents)
- Cannot recommend for local use -- cloud dependency

### Kimi K2.5 (`kimi-k2.5`)
- Moonshot AI multimodal agentic model, 179K pulls
- **Cloud-only on Ollama** (no local download)
- Vision + agent swarm + tool use
- Cannot recommend for local use -- cloud dependency

### DeepSeek V3 (`deepseek-v3`)
- 671B MoE (37B active), 3.7M pulls
- 404 GB download -- impractical for most users
- Frontier-class performance but requires enterprise hardware

### DeepSeek V3.1 (`deepseek-v3.1`)
- Hybrid thinking model, 497K pulls
- Improved reasoning over V3

### DeepSeek V3.2 (not yet on Ollama as standalone)
- 685B parameters, gold-medal IMO performance
- 96% AIME pass rate (beats GPT-5-High)
- Expected on Ollama soon

### Granite 4 (`granite4`)
- IBM's hybrid Mamba-2/Transformer models, 956K pulls
- 350M to 3B sizes, Apache 2.0 license
- Best-in-class instruction following at small sizes (IFEval)
- Great for enterprise tool calling and RAG

### Command A (`command-a`)
- Cohere's 111B enterprise model, 169K pulls
- Optimized for demanding enterprise workflows
- Large download, niche audience

### Nemotron (`nemotron`)
- NVIDIA's Llama-based models, 403K pulls
- Good for roleplay and RAG
- Also see `nemotron-3-super:120b` (MoE) and `nemotron-3-nano`

---

## CATEGORY WINNERS

### Best Coding Models (Ranked)
1. **`qwen3-coder:30b`** -- SWE-bench 69.6%, 3.3B active, efficient
2. **`qwen3.5:27b`** -- SWE-bench 72.4%, great all-rounder too
3. **`devstral:24b`** -- Best for coding agents specifically
4. **`glm-4.7-flash`** -- ELO 1572 on complex coding, 3B active
5. **`qwen3:8b`** -- HumanEval 76.0, best under 8B for code
6. **`gpt-oss:20b`** -- Matches o3-mini reasoning for code
7. **`codestral:22b`** -- 80+ languages, fill-in-the-middle

### Best Reasoning/Math Models (Ranked)
1. **`deepseek-r1:32b`** -- Chain-of-thought reasoning champion
2. **`gpt-oss:120b`** -- Surpasses o4-mini on AIME/MMLU
3. **`exaone-deep:32b`** -- AIME 90.0, rivals DeepSeek-R1 671B
4. **`phi4-mini:3.8b`** -- MATH-500 94.6% at 3.8B params
5. **`magistral:24b`** -- Dedicated chain-of-thought model
6. **`cogito:70b`** -- Beats Llama 4 109B in reasoning mode
7. **`deepseek-r1:8b`** -- Best tiny reasoning model

### Best General Assistant / Conversation (Ranked)
1. **`qwen3.5:9b`** -- Best balance of quality, multimodal, context
2. **`llama3.1:8b`** -- Largest ecosystem, most docs, most fine-tunes
3. **`gemma3:4b`** -- Great on constrained hardware with vision
4. **`gpt-oss:20b`** -- OpenAI quality at 14GB download
5. **`mistral-small3.1:24b`** -- Fast, vision, function calling
6. **`hermes3:8b`** -- Best for roleplay and creative conversation

### Best Vision/Multimodal Models (Ranked)
1. **`qwen3.5:9b`** -- Vision + 256K context + strong quality
2. **`gemma3:12b`** -- Excellent vision at 8.1GB
3. **`mistral-small3.1:24b`** -- Vision + function calling combo
4. **`llama4:16x17b`** -- 10M context + vision (if you have 67GB)
5. **`gemma3n:e4b`** -- Vision on mobile/edge devices

### Best Multilingual Models (Ranked)
1. **`aya-expanse:32b`** -- Purpose-built, 23 languages, beats 70B models
2. **`qwen3.5:9b`** -- Best CJK + strong English
3. **`gemma3n:e4b`** -- 140+ languages at tiny size
4. **`aya-expanse:8b`** -- 23 languages at 8B
5. **`llama3.1:8b`** -- 8 languages, largest ecosystem

### Best for 8GB Hardware (Ranked)
1. **`phi4-mini:3.8b`** -- 2.5GB, insane math/reasoning
2. **`gemma3:4b`** -- 3.3GB, multimodal, well-rounded
3. **`qwen3:4b`** -- 2.5GB, rivals 72B models in efficiency
4. **`qwen3.5:4b`** -- 3.4GB, multimodal + 256K context
5. **`llama3.2:3b`** -- 2.0GB, tool use, 128K context

### Best for 16GB Hardware (Ranked)
1. **`qwen3.5:9b`** -- 6.6GB, the overall champ
2. **`qwen3:8b`** -- 5.2GB, coding specialist
3. **`deepseek-r1:8b`** -- 5.2GB, reasoning specialist
4. **`gemma3:12b`** -- 8.1GB, vision + quality
5. **`llama3.1:8b`** -- 4.9GB, ecosystem champion
6. **`gpt-oss:20b`** -- 14GB, OpenAI reasoning quality

### Best for 32GB Hardware (Ranked)
1. **`qwen3.5:27b`** -- 17GB, SWE-bench 72.4%, multimodal
2. **`qwen3-coder:30b`** -- 19GB, agentic coding beast
3. **`devstral:24b`** -- 14GB, coding agent specialist
4. **`mistral-small3.1:24b`** -- 15GB, vision + tool calling
5. **`glm-4.7-flash`** -- 19GB, developer coding champion
6. **`deepseek-r1:32b`** -- 20GB, reasoning champion

---

## BEGINNER DECISION MATRIX

### "I just want one model that does everything"
--> **`qwen3.5:9b`** (16GB RAM) or **`gemma3:4b`** (8GB RAM)

### "I want to code with AI"
--> **`qwen3:8b`** (16GB) or **`qwen3.5:27b`** (32GB) or **`devstral:24b`** (32GB)

### "I want AI to solve hard problems / math"
--> **`deepseek-r1:8b`** (16GB) or **`deepseek-r1:32b`** (48GB) or **`phi4-mini:3.8b`** (8GB)

### "I want to chat naturally"
--> **`llama3.1:8b`** (16GB) or **`qwen3.5:9b`** (16GB)

### "I want to understand images"
--> **`qwen3.5:9b`** (16GB) or **`gemma3:12b`** (16GB)

### "I speak a language other than English"
--> **`aya-expanse:8b`** (16GB) or **`qwen3.5:9b`** (16GB)

### "I have very limited hardware (8GB)"
--> **`phi4-mini:3.8b`** or **`qwen3.5:4b`** or **`gemma3:4b`**

### "I have a powerful workstation (64GB+)"
--> **`llama3.3:70b`** or **`gpt-oss:120b`** or **`qwen3.5:122b`**

### "I want OpenAI quality, locally"
--> **`gpt-oss:20b`** (16GB) or **`gpt-oss:120b`** (80GB)

---

## MODELS NOT RECOMMENDED FOR BEGINNERS

These are either outdated, superseded, or too niche:

| Model | Why Not | Use Instead |
|-------|---------|-------------|
| `llama3` | Superseded by 3.1/3.2/3.3 | `llama3.1:8b` |
| `llama2` | Very outdated | `llama3.1:8b` |
| `mistral:7b` | Superseded by Small 3.x | `mistral-small3.1:24b` |
| `gemma2` | Superseded by Gemma 3 | `gemma3:4b` |
| `gemma` | Very outdated | `gemma3:4b` |
| `phi3` | Superseded by Phi-4 | `phi4-mini:3.8b` |
| `codellama` | Outdated code model | `qwen3-coder:30b` |
| `starcoder` | v1 is outdated | `starcoder2` or `qwen3-coder` |
| `wizardlm` | Outdated | `qwen3.5:9b` |
| `vicuna` | Very outdated | `llama3.1:8b` |
| `orca-mini` | Outdated | `cogito:8b` |
| `neural-chat` | Outdated | `qwen3.5:9b` |
| `deepseek-coder` | v1 is outdated | `qwen3-coder:30b` |
| `mixtral` | Superseded by gpt-oss, newer MoE | `gpt-oss:20b` |
| `kimi-k2` | Cloud-only, no local run | `qwen3.5:27b` |
| `kimi-k2.5` | Cloud-only, no local run | `qwen3.5:9b` |
| `deepseek-v3` | 404GB download, impractical | `deepseek-r1:32b` |

---

## QUICK REFERENCE: ALL RECOMMENDED MODELS WITH EXACT TAGS

```
# Tier 1 - Essential (pick at least one)
ollama pull qwen3.5:9b          # 6.6GB  - Best all-rounder
ollama pull qwen3:8b            # 5.2GB  - Best coder under 8B
ollama pull deepseek-r1:8b      # 5.2GB  - Best reasoner
ollama pull gemma3:4b           # 3.3GB  - Best for 8GB machines
ollama pull llama3.1:8b         # 4.9GB  - Largest ecosystem

# Tier 2 - Power Users (need 32GB+)
ollama pull qwen3.5:27b         # 17GB   - Coding + multimodal beast
ollama pull gpt-oss:20b         # 14GB   - OpenAI reasoning locally
ollama pull mistral-small3.1:24b # 15GB  - Vision + function calling
ollama pull qwen3-coder:30b     # 19GB   - Agentic coding
ollama pull devstral:24b        # 14GB   - Coding agent specialist

# Tier 3 - Specialists
ollama pull phi4-mini:3.8b      # 2.5GB  - Tiny math genius
ollama pull cogito:8b           # 4.9GB  - Hybrid reasoning
ollama pull glm-4.7-flash       # 19GB   - Dev coding champion
ollama pull magistral:24b       # 14GB   - Chain-of-thought reasoning
ollama pull exaone-deep:32b     # 20GB   - Math olympiad beast

# Tier 4 - Specialized
ollama pull aya-expanse:8b      # 4.9GB  - 23-language multilingual
ollama pull gemma3n:e4b         # 7.5GB  - Mobile/edge deployment
ollama pull llama4:16x17b       # 67GB   - 10M context + vision
ollama pull llama3.3:70b        # 43GB   - Best large local model
ollama pull lfm2.5-thinking     # <1GB   - Ultra-compact reasoning
```

---

## DATA FRESHNESS NOTES

- Ollama library data: Verified live from ollama.com/library on March 24, 2026
- Benchmark scores: Compiled from manufacturer papers, LMSYS Arena, and third-party evaluations
- Community consensus: Aggregated from r/LocalLLaMA, Hacker News, and developer blogs
- Hardware requirements: Based on Q4_K_M quantization (Ollama default)
- Some models (DeepSeek V3.2, newer Kimi variants) may have updates not yet reflected

---

## SOURCES

- [Ollama Model Library](https://ollama.com/library)
- [LMSYS Chatbot Arena Leaderboard](https://huggingface.co/spaces/lmarena-ai/arena-leaderboard)
- [Qwen 3.5 Blog](https://qwen.ai/blog?id=qwen3.5)
- [Qwen 3 Technical Report](https://arxiv.org/html/2505.09388v1)
- [DeepSeek-R1 Paper](https://arxiv.org/html/2501.12948v1)
- [Gemma 3 Technical Report](https://arxiv.org/html/2503.19786v1)
- [Gemma 3n Developer Guide](https://developers.googleblog.com/en/introducing-gemma-3n-developer-guide/)
- [OpenAI gpt-oss Blog](https://openai.com/index/introducing-gpt-oss/)
- [Phi-4 Reasoning Paper](https://www.microsoft.com/en-us/research/wp-content/uploads/2025/04/phi_4_reasoning.pdf)
- [Devstral Announcement](https://mistral.ai/news/mistral-small-3-1)
- [Cogito v1 Preview](https://www.deepcogito.com/research/cogito-v1-preview)
- [GLM-4.7-Flash Guide](https://medium.com/@zh.milo/glm-4-7-flash-the-ultimate-2026-guide-to-local-ai-coding-assistant-93a43c3f8db3)
- [EXAONE Deep Paper](https://arxiv.org/abs/2503.12524)
- [Qwen3-Coder-Next Technical Report](https://arxiv.org/html/2603.00729v1)
- [Magistral Paper](https://arxiv.org/pdf/2506.10910)
- [LFM2.5-Thinking](https://www.liquid.ai/blog/liquid-foundation-models-v2-our-second-series-of-generative-ai-models)
- [Aya Expanse Paper](https://arxiv.org/abs/2412.04261)
- [Granite 4.0 Announcement](https://www.ibm.com/new/announcements/ibm-granite-4-0-hyper-efficient-high-performance-hybrid-models)
- [Best Local LLMs 2026 - SitePoint](https://www.sitepoint.com/best-local-llm-models-2026/)
- [LocalAI Master Small Models Guide](https://localaimaster.com/blog/small-language-models-guide-2026)
- [Ollama VRAM Requirements Guide](https://localllm.in/blog/ollama-vram-requirements-for-local-llms)
- [LLM Leaderboard](https://llm-stats.com/leaderboards/llm-leaderboard)
