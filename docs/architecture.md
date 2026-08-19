# 排盘系统分层

```text
阳历 / 地点 / 配置
        │
        ▼
 four-pillars        公历、校时、四柱、起运
        │
        ▼
 metaphysics-core    节气、中气月将、阴阳九局、三元/三候、符头、值符值使
        │
        ├─────────────┐
        ▼             ▼
    liu-ren         qi-men          独立领域简盘
        └──────┬──────┘
               ▼
        simple-chart JSON/TXT        脚本、文件与 API 交换层
               │
               ▼
        reading-session              Web 详细排盘编排层
          ├── chart-presentation
          ├── LiuRenPanel
          └── QiMenPanel
```

## 依赖规则

1. `four-pillars.mjs` 是标准时、真太阳时、四柱与起运事实的唯一来源。
2. `metaphysics-core.mjs` 只消费四柱结果，统一派生节气、月将、阴阳九局、三元三候、符头、旬首、值符值使、十二长生等公共规则。
3. `liu-ren.mjs` 与 `qi-men.mjs` 消费同一份公共核心，不互相调用，也不重新解释阳历时间。
4. `simple-chart.mjs` 是稳定的 JSON/TXT 交换层；CLI、文件和简化 API 使用它，Web 详细盘也从它继续展开。
5. `reading-session.mjs` 只把简盘 JSON 与八字展示结果组织给 Web，不包含具体术数规则。
6. `app/components/` 只负责各 Tab 的交互、颜色与排版，不实现排盘算法。
7. `birth-code.mjs` 是 Web 紧凑文字录入适配器，统一解析 `0/1 + yyyyMMddHHmm`，再把标准时间和性别交给四柱层。
8. 新增术数时，应先判断规则属于公共核心还是独立领域，再注册到简盘与详细盘；不得把算法写入页面组件。

## Web 模块

- `module-tabs.tsx`：四个互斥 Tab 的导航。
- `page.tsx`：保存共用时间与当前 Tab，调用应用编排层。
- `liuren-panel.tsx`、`qimen-panel.tsx`、`reverse-panel.tsx`：独立界面组件。
- `bazi-node-panel.tsx`：独立八字节点与正交路径界面模块，置于八字页末尾。
- 八字录入、八字盘面和大运由首页的八字容器编排；其数据仍全部来自 `chart-presentation.mjs`，不包含历法算法。
