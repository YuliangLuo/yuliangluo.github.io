---
title: 白盒测试 Agent：从规则脚本到领域智能体
date: 2026-06-04
tags: [White-box Test, AI Agent, Test Automation, BMS]
---

# 白盒测试 Agent：从规则脚本到领域智能体

白盒测试 Agent 的核心目标不是“让大模型代替测试工程师”，而是把测试工程师的领域判断拆成可执行、可审计、可复现的流程：读取输入、选择工具、执行检查、解释异常、生成报告。

## 1. 系统边界

白盒测试 Agent 不应直接无约束控制硬件。更合理的边界是：

```text
Human/Test Plan
      |
      v
Agent Orchestrator
      |
      +--> Test Case Generator
      +--> Register/Log Parser
      +--> Waveform/CSV Analyzer
      +--> Rule Engine
      +--> Report Generator
      |
      v
Human Review / CI Gate
```

Agent 可以提出测试动作、生成脚本、分析日志，但涉及烧录、Fuse、保护阈值、真实电源输出、温箱控制等高风险动作时，应经过显式授权或由固定流程执行。

## 2. 最小可用架构

```text
Input
  ├─ Requirement / Spec
  ├─ Test plan
  ├─ Register dump
  ├─ SMBus log
  ├─ Oscilloscope CSV
  └─ Failure report

Runtime
  ├─ Planner
  ├─ Tool Router
  ├─ Tool Registry
  ├─ Domain Rule Engine
  ├─ Memory / Knowledge Base
  ├─ Verifier
  └─ Reporter

Output
  ├─ Root cause hypothesis
  ├─ Missing data checklist
  ├─ Reproduction steps
  ├─ Test script
  ├─ Risk list
  └─ Customer-facing report draft
```

## 3. 工具注册接口

工具必须显式声明输入、输出、权限和失败模式。不要只暴露一个“万能 Python 执行器”。

```python
from dataclasses import dataclass
from typing import Callable, Any, Literal

Permission = Literal["read_only", "lab_control", "write_device", "dangerous"]

@dataclass
class ToolSpec:
    name: str
    description: str
    permission: Permission
    timeout_s: int
    func: Callable[..., Any]

class ToolRegistry:
    def __init__(self):
        self._tools: dict[str, ToolSpec] = {}

    def register(self, tool: ToolSpec) -> None:
        if tool.name in self._tools:
            raise ValueError(f"duplicated tool: {tool.name}")
        self._tools[tool.name] = tool

    def get(self, name: str) -> ToolSpec:
        return self._tools[name]
```

## 4. 测试用例数据模型

```yaml
id: BMS-SMBUS-001
title: SMBus block read timeout verification
target:
  device: bms-board-a
  interface: smbus
precondition:
  voltage: 16.0V
  temperature: 25C
  fet_state: C_ON_D_ON
steps:
  - action: read_sbs
    command: 0x09
    expect: voltage_in_range
  - action: block_read
    command: 0x23
    max_length: 32
  - action: collect_log
    duration_s: 10
checks:
  - no_sda_low_timeout
  - no_watchdog_reset
  - pec_valid
artifacts:
  - smbus_log
  - register_dump
  - waveform_csv
```

这种结构的好处是：Agent 可以生成、修改、解释测试用例，但实际执行器仍然是确定性的。

## 5. 白盒判断规则

领域规则应独立于大模型，作为确定性检查模块存在。

```python
def check_smbus_block_read_length(frame: bytes) -> list[str]:
    issues = []
    if not frame:
        return ["empty frame"]

    length = frame[0]
    if length > 32:
        issues.append(f"SMBus block length exceeds 32 bytes: {length}")

    if len(frame) < length + 1:
        issues.append(f"truncated block read: length={length}, actual={len(frame)-1}")

    return issues
```

Agent 的价值在于把规则检查结果与上下文关联起来：例如把 `SDA low timeout`、`Block Read length`、`WDT reset`、`USB bridge unplug` 合并成一个更完整的根因假设。

## 6. 执行闭环

```text
1. 读取测试目标
2. 选择测试模板
3. 生成 test case
4. 人工确认危险动作
5. 执行测试
6. 收集 log / dump / waveform
7. 规则引擎做确定性检查
8. Agent 做跨文件归因
9. Verifier 检查结论是否有证据支撑
10. 生成报告
```

## 7. 生产级风险

| 风险 | 对策 |
|---|---|
| Agent 幻觉根因 | 每个结论必须绑定 log、寄存器、波形或测试步骤证据 |
| 工具误调用 | 工具权限分级，危险工具必须人工确认 |
| 测试不可复现 | 固化环境、版本、输入、脚本、随机种子 |
| 报告过度自信 | 输出 hypothesis / evidence / missing data 三段式 |
| 隐私和客户资料泄露 | 本地知识库、脱敏、访问审计、禁止上传 NDA 原文 |

## 8. 建议落地路线

第一阶段只做只读分析：日志解析、寄存器 dump 检查、测试报告生成。

第二阶段加入半自动执行：生成测试脚本，由人工确认后执行。

第三阶段再接入实验室设备：电源、电子负载、温箱、示波器，但所有高风险动作必须保留硬阈值和人工确认。

最终目标不是“自动说结论”，而是“把测试判断变成可回放的证据链”。
