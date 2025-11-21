import { DiagramType } from '@/types/diagram'

export interface DiagramTemplate {
  id: string
  name: string
  description: string
  type: DiagramType
  code: string
  tags: string[]
  thumbnail?: string
}

export const TEMPLATES: DiagramTemplate[] = [
  // Flowchart Templates
  {
    id: 'flowchart-basic',
    name: '基础流程图',
    description: '简单的开始-处理-结束流程',
    type: DiagramType.FLOWCHART,
    code: `flowchart TD
    A[开始] --> B[处理数据]
    B --> C{是否成功?}
    C -->|是| D[输出结果]
    C -->|否| E[错误处理]
    D --> F[结束]
    E --> F`,
    tags: ['基础', '流程'],
  },
  {
    id: 'flowchart-login',
    name: '用户登录流程',
    description: '包含验证和错误处理的登录流程',
    type: DiagramType.FLOWCHART,
    code: `flowchart TD
    A[用户访问登录页] --> B[输入用户名密码]
    B --> C[提交表单]
    C --> D{验证输入格式}
    D -->|格式错误| E[显示错误提示]
    E --> B
    D -->|格式正确| F[发送登录请求]
    F --> G{服务器验证}
    G -->|验证失败| H[显示错误信息]
    H --> B
    G -->|验证成功| I[保存登录状态]
    I --> J[跳转到主页]
    J --> K[结束]`,
    tags: ['用户', '登录', '验证'],
  },
  {
    id: 'flowchart-payment',
    name: '支付流程',
    description: '电商支付流程图',
    type: DiagramType.FLOWCHART,
    code: `flowchart TD
    A[用户选择商品] --> B[加入购物车]
    B --> C[确认订单]
    C --> D[选择支付方式]
    D --> E{支付类型}
    E -->|支付宝| F[调用支付宝API]
    E -->|微信| G[调用微信支付API]
    E -->|银行卡| H[调用银行支付API]
    F --> I{支付结果}
    G --> I
    H --> I
    I -->|成功| J[更新订单状态]
    I -->|失败| K[显示错误并重试]
    K --> D
    J --> L[发送确认邮件]
    L --> M[完成]`,
    tags: ['电商', '支付', '业务'],
  },

  // Architecture Templates
  {
    id: 'arch-web-basic',
    name: '基础Web架构',
    description: '前后端分离的Web应用架构',
    type: DiagramType.ARCHITECTURE,
    code: `flowchart TB
    subgraph 客户端
        A[Web浏览器]
    end

    subgraph 前端层
        B[React应用]
    end

    subgraph 后端层
        C[API网关]
        D[应用服务器]
    end

    subgraph 数据层
        E[(数据库)]
        F[(缓存Redis)]
    end

    A --> B
    B --> C
    C --> D
    D --> E
    D --> F`,
    tags: ['Web', '架构', '前后端分离'],
  },
  {
    id: 'arch-microservices',
    name: '微服务架构',
    description: '典型的微服务系统架构',
    type: DiagramType.ARCHITECTURE,
    code: `flowchart TB
    A[移动客户端] --> B[API网关]
    C[Web客户端] --> B

    B --> D[用户服务]
    B --> E[订单服务]
    B --> F[支付服务]
    B --> G[通知服务]

    D --> H[(用户数据库)]
    E --> I[(订单数据库)]
    F --> J[(支付数据库)]

    D --> K[Redis缓存]
    E --> K
    F --> K

    G --> L[消息队列]
    E --> L
    F --> L`,
    tags: ['微服务', '分布式', '架构'],
  },

  // Sequence Diagram Templates
  {
    id: 'sequence-api',
    name: 'API调用时序图',
    description: 'RESTful API请求响应流程',
    type: DiagramType.SEQUENCE,
    code: `sequenceDiagram
    participant C as 客户端
    participant A as API网关
    participant S as 服务器
    participant D as 数据库

    C->>A: POST /api/login
    A->>S: 转发请求
    S->>D: 查询用户信息
    D-->>S: 返回用户数据
    S->>S: 验证密码
    S-->>A: 返回JWT Token
    A-->>C: 200 OK {token}
    Note over C: 保存token到本地`,
    tags: ['API', '时序', 'RESTful'],
  },
  {
    id: 'sequence-order',
    name: '订单创建流程',
    description: '电商订单创建的完整时序',
    type: DiagramType.SEQUENCE,
    code: `sequenceDiagram
    actor U as 用户
    participant F as 前端
    participant O as 订单服务
    participant P as 商品服务
    participant I as 库存服务
    participant DB as 数据库

    U->>F: 点击购买
    F->>O: 创建订单
    O->>P: 获取商品信息
    P-->>O: 返回商品详情
    O->>I: 检查库存
    alt 库存充足
        I-->>O: 库存可用
        O->>DB: 保存订单
        O->>I: 锁定库存
        I-->>O: 库存已锁定
        O-->>F: 订单创建成功
        F-->>U: 显示订单确认
    else 库存不足
        I-->>O: 库存不足
        O-->>F: 创建失败
        F-->>U: 提示库存不足
    end`,
    tags: ['订单', '电商', '业务流程'],
  },

  // ER Diagram Templates
  {
    id: 'er-blog',
    name: '博客系统ER图',
    description: '简单博客系统的数据模型',
    type: DiagramType.ER,
    code: `erDiagram
    USER ||--o{ POST : writes
    USER ||--o{ COMMENT : makes
    POST ||--o{ COMMENT : has
    POST }o--|| CATEGORY : belongs_to
    POST }o--o{ TAG : tagged_with

    USER {
        int id PK
        string username
        string email
        string password
        datetime created_at
    }

    POST {
        int id PK
        int user_id FK
        int category_id FK
        string title
        text content
        datetime created_at
    }

    COMMENT {
        int id PK
        int post_id FK
        int user_id FK
        text content
        datetime created_at
    }

    CATEGORY {
        int id PK
        string name
    }

    TAG {
        int id PK
        string name
    }`,
    tags: ['博客', 'ER图', '数据库'],
  },
  {
    id: 'er-ecommerce',
    name: '电商系统ER图',
    description: '电商平台核心数据模型',
    type: DiagramType.ER,
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : "ordered in"
    PRODUCT }o--|| CATEGORY : belongs_to

    CUSTOMER {
        int customer_id PK
        string name
        string email
        string phone
        string address
    }

    ORDER {
        int order_id PK
        int customer_id FK
        decimal total_amount
        string status
        datetime created_at
    }

    ORDER_ITEM {
        int item_id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal price
    }

    PRODUCT {
        int product_id PK
        int category_id FK
        string name
        decimal price
        int stock
    }

    CATEGORY {
        int category_id PK
        string name
    }`,
    tags: ['电商', 'ER图', '订单'],
  },

  // Gantt Chart Templates
  {
    id: 'gantt-project',
    name: '项目开发计划',
    description: '软件项目开发甘特图',
    type: DiagramType.GANTT,
    code: `gantt
    title 软件开发项目计划
    dateFormat YYYY-MM-DD
    section 需求阶段
    需求收集           :a1, 2024-01-01, 7d
    需求分析           :a2, after a1, 5d
    需求评审           :a3, after a2, 2d
    section 设计阶段
    概要设计           :b1, after a3, 5d
    详细设计           :b2, after b1, 7d
    设计评审           :b3, after b2, 2d
    section 开发阶段
    后端开发           :c1, after b3, 14d
    前端开发           :c2, after b3, 14d
    单元测试           :c3, after c1, 7d
    section 测试阶段
    集成测试           :d1, after c3, 5d
    系统测试           :d2, after d1, 5d
    用户验收测试        :d3, after d2, 3d
    section 上线阶段
    部署准备           :e1, after d3, 2d
    正式上线           :milestone, e2, after e1, 1d`,
    tags: ['项目管理', '甘特图', '开发'],
  },

  // Class Diagram Template
  {
    id: 'class-design-pattern',
    name: '设计模式类图',
    description: '观察者模式的UML类图',
    type: DiagramType.CLASS,
    code: `classDiagram
    class Subject {
        -observers: List~Observer~
        +attach(observer: Observer)
        +detach(observer: Observer)
        +notify()
    }

    class Observer {
        <<interface>>
        +update()
    }

    class ConcreteSubject {
        -state: String
        +getState()
        +setState(state: String)
    }

    class ConcreteObserver {
        -subject: ConcreteSubject
        +update()
    }

    Subject <|-- ConcreteSubject
    Observer <|.. ConcreteObserver
    Subject o-- Observer
    ConcreteObserver --> ConcreteSubject`,
    tags: ['设计模式', 'UML', '类图'],
  },
]

// Filter templates by type
export const getTemplatesByType = (type: DiagramType): DiagramTemplate[] => {
  return TEMPLATES.filter((t) => t.type === type)
}

// Search templates
export const searchTemplates = (query: string): DiagramTemplate[] => {
  const lowerQuery = query.toLowerCase()
  return TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )
}

// Get template by ID
export const getTemplateById = (id: string): DiagramTemplate | undefined => {
  return TEMPLATES.find((t) => t.id === id)
}