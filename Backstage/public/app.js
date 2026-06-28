const resources = {
  dashboard: {
    title: '管理看板',
    desc: '管理端查看点击量、客户信息量、阿姨信息量、发布量和业务状态汇总。',
    custom: 'dashboard'
  },
  auditLogs: {
    title: '\u64cd\u4f5c\u8bb0\u5f55',
    desc: '\u7ba1\u7406\u7aef\u67e5\u770b\u8c01\u5728\u4ec0\u4e48\u65f6\u95f4\u505a\u4e86\u4ec0\u4e48\uff0c\u652f\u6301\u68c0\u7d22\u548c\u4e00\u952e\u5bfc\u51fa\u3002',
    custom: 'auditLogs'
  },
  todos: {
    title: '今日待办',
    desc: '按负责人、下次跟进时间和状态查看客户跟进任务。',
    custom: 'todos'
  },
  accounts: {
    title: '账号权限',
    desc: '规划后台正式登录入口，并按运营端、管理端分组管理真实账号。',
    fields: [
      ['name', '姓名/账号名称'],
      ['phone', '手机号/登录账号'],
      ['role', '账号角色', 'select', ['运营端', '管理端']],
      ['entry', '进入端口', 'select', ['微信小程序', '后台管理']],
      ['permissions', '权限说明，逗号分隔'],
      ['status', '状态', 'select', ['启用', '停用']],
      ['note', '备注', 'textarea']
    ],
    summary: (item) => [
      `${displayRoleName(item.role)} / ${item.entry || '-'}`,
      `权限：${Array.isArray(item.permissions) ? item.permissions.join('、') : item.permissions || '-'}`,
      `状态：${item.status || '-'}`
    ]
  },
  companyProfile: {
    title: '公司基础信息',
    desc: '统一维护小程序展示的公司名称、Logo、默认城市、客服电话、地址和营业时间。',
    custom: 'companyProfile',
    fields: [
      ['companyName', '公司名称'],
      ['shortName', '公司简称'],
      ['companyLogo', '公司 Logo', 'image'],
      ['defaultCity', '默认城市或服务城市'],
      ['introduction', '公司简介', 'textarea'],
      ['customerServicePhone', '客服电话'],
      ['address', '公司地址', 'textarea'],
      ['businessHours', '营业时间']
    ]
  },
  banners: {
    title: '首页轮播',
    desc: '维护小程序首页顶部展示图、活动图和推荐入口。',
    fields: [
      ['title', '标题'],
      ['subtitle', '副标题'],
      ['image', '展示图片', 'image'],
      ['targetType', '跳转类型', 'select', ['无跳转', '找阿姨', '发布需求', '门店', '公司介绍']],
      ['sort', '排序', 'number'],
      ['visible', '是否显示', 'boolean']
    ],
    summary: (item) => [
      item.subtitle || '-',
      `跳转：${item.targetType || '无跳转'}`,
      `排序：${item.sort || 0}`
    ]
  },
  ayis: {
    title: '阿姨管理',
    desc: '维护阿姨资料、服务类型、薪资和审核状态。',
    fields: [
      ['image', '阿姨照片', 'image'],
      ['name', '姓名'],
      ['phone', '手机号'],
      ['source', '来源', 'select', ['小程序', '电话', '微信', '门店', '后台录入']],
      ['age', '年龄', 'number'],
      ['hometown', '籍贯'],
      ['serviceType', '服务类型', 'select', ['育儿嫂', '月嫂', '住家保姆', '小时工', '老人陪护']],
      ['experience', '工作年限', 'number'],
      ['liveType', '是否住家', 'select', ['住家', '不住家', '可协商']],
      ['salary', '期望薪资'],
      ['availableTime', '可上户时间'],
      ['skills', '技能标签，逗号分隔'],
      ['storeId', '所属门店ID', 'number'],
      ['featured', '是否金牌推荐', 'boolean'],
      ['featuredTitle', '推荐称号'],
      ['status', '状态', 'select', ['待审核', '已认证', '已下架']],
      ['visible', '是否在小程序展示', 'visibility'],
      ['idCardImage', '身份证照片', 'image'],
      ['healthCertImage', '健康证照片', 'image'],
      ['skillCertImage', '技能证书照片', 'image'],
      ['intro', '自我介绍', 'textarea']
    ],
    summary: (item) => [
      `${item.serviceType || '-'} / ${item.age || '-'}岁 / ${item.experience || '-'}年经验`,
      `${item.hometown || '-'} / ${item.salary || '-'}`,
      `状态：${item.status || '-'}`
    ]
  },
  demands: {
    title: '客户需求',
    desc: '客户发布需求后，后台跟进匹配、面试和成交状态。',
    fields: [
      ['customerName', '客户姓名'],
      ['phone', '手机号'],
      ['source', '来源', 'select', ['小程序', '电话', '微信', '门店', '后台录入']],
      ['serviceType', '服务类型', 'select', ['育儿嫂', '月嫂', '住家保姆', '小时工', '老人陪护']],
      ['city', '城市'],
      ['address', '地址'],
      ['startTime', '上户时间'],
      ['budget', '预算'],
      ['familyInfo', '家庭情况', 'textarea'],
      ['consultant', '跟进顾问'],
      ['followNote', '跟进备注', 'textarea'],
      ['status', '状态', 'select', ['待处理', '已联系', '匹配中', '已匹配', '已关闭']]
    ],
    summary: (item) => [
      `${item.serviceType || '-'} / ${item.budget || '-'}`,
      `${item.city || ''} ${item.address || ''}`,
      `状态：${item.status || '-'}`
    ]
  },
  appointments: {
    title: '预约面试',
    desc: '客户预约某位阿姨后，后台安排面试和跟进结果。',
    fields: [
      ['customerName', '客户姓名'],
      ['phone', '手机号'],
      ['ayiName', '预约阿姨'],
      ['serviceType', '服务类型', 'select', ['育儿嫂', '月嫂', '住家保姆', '小时工', '老人陪护']],
      ['date', '面试时间'],
      ['address', '面试地址'],
      ['consultant', '跟进顾问'],
      ['status', '状态', 'select', ['待联系', '已确认', '已面试', '已取消', '已成交']],
      ['note', '备注', 'textarea']
    ],
    summary: (item) => [
      `${item.ayiName || '-'} / ${item.serviceType || '-'}`,
      `${item.date || '-'} / ${item.address || '-'}`,
      `状态：${item.status || '-'}`
    ]
  },
  appointments: {
    title: '面试安排',
    desc: '面试记录从客户需求进入，只维护面试时间、方式、状态、结果和下一步安排。',
    fields: [
      ['demandId', '关联客户需求ID', 'number'],
      ['ayiId', '关联阿姨ID', 'number'],
      ['customerName', '客户姓名'],
      ['phone', '手机号'],
      ['ayiName', '预约阿姨'],
      ['serviceType', '服务类型', 'select', ['育儿嫂', '月嫂', '住家保姆', '小时工', '老人陪护']],
      ['date', '面试日期和时间'],
      ['interviewMethod', '面试方式', 'select', ['到店面试', '上门面试', '视频面试', '电话沟通', '其他']],
      ['address', '面试地点或线上说明'],
      ['status', '面试状态', 'select', ['待安排', '待面试', '面试中', '已面试', '跟进中', '已完成', '已取消']],
      ['interviewResult', '面试结果', 'textarea'],
      ['nextStep', '下一步安排', 'textarea'],
      ['consultant', '跟进顾问'],
      ['note', '备注', 'textarea']
    ],
    summary: (item) => [
      `${item.ayiName || '-'} / ${item.serviceType || '-'}`,
      `${item.date || '-'} / ${item.interviewMethod || '-'} / ${item.address || '-'}`,
      `状态：${item.status || '-'}`
    ]
  },
  exportInfo: {
    title: '导出信息',
    desc: '按对象、日期和业务条件查询并导出当前结果。',
    custom: 'exportInfo'
  },
  applications: {
    title: '接单申请',
    desc: '阿姨看到客户需求后申请接单，后台审核和安排沟通。',
    fields: [
      ['ayiName', '阿姨姓名'],
      ['ayiPhone', '阿姨手机号'],
      ['demandId', '客户需求ID', 'number'],
      ['serviceType', '服务类型', 'select', ['育儿嫂', '月嫂', '住家保姆', '小时工', '老人陪护']],
      ['customerAddress', '客户地址'],
      ['startTime', '上户时间'],
      ['budget', '预算'],
      ['consultant', '跟进顾问'],
      ['status', '状态', 'select', ['已申请', '已联系', '已推荐', '已拒绝', '已成交']],
      ['note', '备注', 'textarea']
    ],
    summary: (item) => [
      `${item.ayiName || '-'} 申请 ${item.serviceType || '-'}`,
      `${item.customerAddress || '-'} / ${item.budget || '-'}`,
      `状态：${item.status || '-'}`
    ]
  },
  orders: {
    title: '订单跟进',
    desc: '客户和阿姨确认后形成订单，后台维护成交、合同、服务状态。',
    fields: [
      ['orderNo', '订单编号'],
      ['customerName', '客户姓名'],
      ['customerPhone', '客户手机号'],
      ['ayiName', '阿姨姓名'],
      ['ayiPhone', '阿姨手机号'],
      ['serviceType', '服务类型', 'select', ['育儿嫂', '月嫂', '住家保姆', '小时工', '老人陪护']],
      ['address', '服务地址'],
      ['startTime', '上户时间'],
      ['price', '成交价格'],
      ['consultant', '跟进顾问'],
      ['contractStatus', '合同状态', 'select', ['未签约', '已签约', '已作废']],
      ['payStatus', '付款状态', 'select', ['未付款', '已付定金', '已结清', '已退款']],
      ['status', '服务状态', 'select', ['待上户', '服务中', '已完成', '已取消']],
      ['note', '备注', 'textarea']
    ],
    summary: (item) => [
      `${item.customerName || '-'} / ${item.ayiName || '-'}`,
      `${item.serviceType || '-'} / ${item.price || '-'}`,
      `状态：${item.status || '-'} / ${item.payStatus || '-'}`
    ]
  },
  orderDispatches: {
    title: '人工派单',
    desc: '记录订单人工派单和更换阿姨过程，供管理端查看最近操作。',
    fields: [
      ['orderId', '订单ID', 'number'],
      ['orderNo', '订单编号'],
      ['ayiName', '阿姨姓名'],
      ['ayiPhone', '阿姨手机号'],
      ['dispatchType', '派单类型', 'select', ['人工派单', '更换阿姨']],
      ['status', '状态', 'select', ['已派单', '已接受', '已拒绝', '已取消']],
      ['assignedBy', '派单人'],
      ['note', '备注', 'textarea']
    ],
    summary: (item) => [
      `${item.orderNo || item.orderId || '-'} / ${item.ayiName || '-'}`,
      `${item.dispatchType || '-'} / ${item.assignedBy || '-'}`,
      `状态：${item.status || '-'} / ${item.visible === false ? '小程序下架' : '小程序上架'}`
    ]
  },
  stores: {
    title: '门店信息',
    desc: '维护门店名称、地址、电话、覆盖范围和是否显示。',
    fields: [
      ['image', '门店图片', 'image'],
      ['name', '门店名称'],
      ['district', '区域', 'select', ['东城区', '朝阳区', '海淀区', '丰台区', '通州区', '西城区']],
      ['address', '地址'],
      ['phone', '电话'],
      ['area', '覆盖范围'],
      ['tags', '服务标签，逗号分隔'],
      ['canStay', '可住宿', 'boolean'],
      ['visible', '是否显示', 'boolean'],
      ['intro', '门店简介', 'textarea'],
      ['businessHours', '营业时间'],
      ['managerName', '店长姓名'],
      ['managerTitle', '店长职位'],
      ['managerImage', '店长照片', 'image'],
      ['managerIntro', '店长简介', 'textarea'],
      ['staffCount', '员工人数', 'number'],
      ['consultantCount', '顾问人数', 'number'],
      ['ayiCount', '阿姨储备数量', 'number'],
      ['teamIntro', '团队简介', 'textarea'],
      ['latitude', '纬度', 'number'],
      ['longitude', '经度', 'number']
    ],
    summary: (item) => [
      `${item.district || '-'} / ${item.phone || '-'}`,
      item.address || '-',
      `覆盖：${item.area || '-'}`
    ]
  },
  serviceModules: {
    title: '服务中心',
    desc: '维护客户端首页“服务中心”的服务说明和具体家政服务入口。',
    fields: [
      ['title', '显示名称'],
      ['summary', '说明文字', 'textarea'],
      ['moduleType', '项目类型', 'select', ['highlight', 'service', 'shortcut']],
      ['iconText', '文字图标'],
      ['iconImage', '贴图地址', 'image'],
      ['theme', '视觉主题', 'select', ['green', 'mint', 'rose', 'blue', 'warm']],
      ['targetType', '点击行为', 'select', ['none', 'find_ayi', 'demand', 'customer_service', 'about', 'service', 'store', '无跳转', '找阿姨', '发布需求', '门店', '公司介绍']],
      ['targetValue', '点击参数'],
      ['image', '展示图片', 'image'],
      ['sort', '排序', 'number'],
      ['visible', '是否显示', 'boolean']
    ],
    summary: (item) => [
      item.moduleType === 'shortcut'
        ? `跳转：${displaySelectOption('targetType', item.targetType || 'none')}`
        : item.moduleType === 'service'
          ? `标签：${item.iconText || '-'}`
          : `副标题：${item.iconText || '-'}`,
      item.summary || '-',
      `排序：${item.sort || 0}`,
      `显示：${String(item.visible)}`
    ]
  }
};

let currentResource = 'accounts';
let currentRoute = 'home';
let currentRecord = null;
let cache = [];
let pendingImages = {};
let currentUser = null;
let authToken = null;
let allowedResources = [];
let miniprogramUsers = [];
let expandedAccountRole = null;
let currentModuleCategory = null;
let currentModuleSearchKey = '';
let currentModuleSearchQuery = '';
let resourceDateFilters = {
  demands: { preset: 'all', startDate: '', endDate: '' },
  ayis: { preset: 'all', startDate: '', endDate: '' },
  appointments: { preset: 'all', startDate: '', endDate: '' }
};
let auditLogFilters = {
  actor: '',
  role: '',
  entityType: '',
  action: '',
  startTime: '',
  endTime: '',
  keyword: '',
  page: 1,
  pageSize: 20
};
let auditLogTotal = 0;
let auditLogTotalPages = 1;
let todoFilters = {
  category: 'today',
  keyword: '',
  operatorId: '',
  page: 1,
  pageSize: 20
};
let todoStats = {};
let todoTotal = 0;
let todoTotalPages = 1;
let assignableOperators = [];
let backstageNotifications = [];
let notificationFilters = { messageType: '', startDate: '', endDate: '' };
let exportInfoFilters = {
  type: 'demands',
  preset: 'today',
  startDate: '',
  endDate: '',
  status: '',
  serviceType: '',
  store: '',
  operator: '',
  interviewMethod: '',
  page: 1,
  pageSize: 20
};
let exportInfoResult = null;
let dashboardData = null;
let dashboardFilters = {
  preset: 'today',
  startDate: '',
  endDate: '',
  metric: 'customersTotal',
  compareMetric: 'effectiveOperations',
  storeName: '',
  status: '',
  serviceType: '',
  keyword: '',
  page: 1,
  pageSize: 20
};

const roleDisplayMap = {
  管理端: '管理端',
  运营端: '运营端',
  boss: '管理端',
  operator: '运营端'
};

roleDisplayMap[`老${'板'}端`] = '管理端';

const rolePersistMap = {
  管理端: '管理端',
  运营端: '运营端'
};

const routeToResourceMap = {
  dashboard: 'dashboard',
  accounts: 'accounts',
  'audit-logs': 'auditLogs',
  exports: 'exportInfo',
  todos: 'todos',
  company: 'companyProfile',
  ayis: 'ayis',
  demands: 'demands',
  appointments: 'appointments',
  'demands-list': 'demands',
  'demands-interviews': 'appointments',
  applications: 'applications',
  orders: 'orders',
  dispatches: 'orderDispatches',
  stores: 'stores',
  'company-services': 'serviceModules'
};

const resourceToRouteMap = Object.entries(routeToResourceMap).reduce((result, [route, resource]) => {
  result[resource] = route;
  return result;
}, {});
resourceToRouteMap.serviceModules = 'company-services';

const serviceModuleFieldPresets = {
  highlight: {
    moduleType: 'highlight',
    fields: [
      ['title', '标题'],
      ['iconText', '副标题'],
      ['summary', '说明文字', 'textarea'],
      ['image', '说明图片', 'image'],
      ['sort', '排序', 'number'],
      ['visible', '是否显示', 'boolean']
    ]
  },
  service: {
    moduleType: 'service',
    fields: [
      ['title', '服务名称'],
      ['summary', '服务介绍', 'textarea'],
      ['iconImage', '服务图片', 'image'],
      ['iconText', '服务标签'],
      ['sort', '排序', 'number'],
      ['visible', '是否显示', 'boolean']
    ]
  },
  shortcut: {
    moduleType: 'shortcut',
    fields: [
      ['title', '名称'],
      ['summary', '说明', 'textarea'],
      ['iconImage', '图标', 'image'],
      ['targetType', '跳转目标', 'select', ['none', 'find_ayi', 'demand', 'customer_service', 'about', 'service', 'store']],
      ['sort', '排序', 'number'],
      ['visible', '是否显示', 'boolean']
    ]
  }
};

const companyServicePages = [
  {
    key: 'common-info',
    route: 'company-services/common-info',
    title: '公共信息配置',
    desc: '唯一维护公司名称、Logo、默认城市、客服电话、联系地址和营业时间，其他页面不再重复保存这些字段。',
    kind: 'resource',
    resource: 'companyProfile',
    source: 'company_profile'
  },
  {
    key: 'service-types',
    route: 'company-services/service-types',
    title: '家政服务类型',
    desc: '唯一维护家政服务类型本身。首页、服务页、需求表单、阿姨资料和公司介绍只读取这里的数据。',
    kind: 'serviceModules',
    moduleType: 'service',
    source: 'service_modules.service',
    fields: [
      ['title', '服务名称'],
      ['summary', '服务介绍', 'textarea'],
      ['iconImage', '服务图片', 'image'],
      ['iconText', '服务标签'],
      ['sort', '排序', 'number'],
      ['visible', '是否显示', 'boolean']
    ]
  },
  {
    key: 'home',
    route: 'company-services/home',
    title: '首页配置',
    desc: '按首页实际页面继续下钻到客户首页配置，避免直接混合显示所有首页数据。',
    cards: [
      {
        key: 'customer-home',
        title: '客户首页',
        desc: '只维护客户身份首页的主视觉、轮播、快捷入口、服务概览和服务流程；服务类型与推荐阿姨读取唯一数据源。',
        route: 'company-services/home/customer',
        kind: 'page',
        source: 'customer-home',
        cards: [
          { key: 'hero', title: '顶部主视觉', desc: '维护主标题、副标题和两个按钮文案及跳转；城市、公司名称和 Logo 读取公共信息配置。', route: 'company-services/home/customer/hero', kind: 'homeHero', source: 'service_modules.highlight + company_profile' },
          { key: 'banners', title: '首页轮播', desc: '复用现有轮播管理，维护图片、标题、跳转、排序和显示状态。', route: 'company-services/home/customer/banners', kind: 'resource', resource: 'banners', source: 'banners' },
          { key: 'shortcuts', title: '首页快捷入口', desc: '维护名称、说明、图标、跳转目标、排序和是否显示。', route: 'company-services/home/customer/shortcuts', kind: 'serviceModules', moduleType: 'shortcut', filterTargetValue: 'customer_home_shortcuts', source: 'service_modules.shortcut' },
          { key: 'overview', title: '公司服务概览', desc: '维护标题、数值或内容、排序和是否显示。', route: 'company-services/home/customer/overview', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'customer_home_overview', source: 'service_modules.highlight', fields: [
            ['title', '标题'],
            ['iconText', '数值或内容'],
            ['summary', '说明文字', 'textarea'],
            ['sort', '排序', 'number'],
            ['visible', '是否显示', 'boolean']
          ] },
          { key: 'flow', title: '服务流程', desc: '维护步骤编号、标题、说明、排序和是否显示。', route: 'company-services/home/customer/flow', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'customer_home_flow', source: 'service_modules.highlight', fields: [
            ['iconText', '步骤编号'],
            ['title', '标题'],
            ['summary', '说明', 'textarea'],
            ['sort', '排序', 'number'],
            ['visible', '是否显示', 'boolean']
          ] }
        ]
      }
      ,
      {
        key: 'ayi-home',
        title: '阿姨首页',
        desc: '只维护阿姨身份首页的顶部信息、快捷入口、完善资料提示、功能导航和推荐工作区域。',
        route: 'company-services/home/ayi',
        kind: 'page',
        source: 'ayi-home',
        cards: [
          { key: 'top-info', title: '顶部信息', desc: '维护页面标题和说明文字；城市读取公共信息配置。', route: 'company-services/home/ayi/top-info', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'ayi_home_top', source: 'service_modules.highlight + company_profile', fields: [
            ['title', '页面标题'],
            ['summary', '说明文字', 'textarea'],
            ['visible', '是否显示', 'boolean']
          ] },
          { key: 'quick-entries', title: '快捷入口', desc: '维护个人资料、我的接单等入口的名称、说明、排序和显示状态。', route: 'company-services/home/ayi/quick-entries', kind: 'serviceModules', moduleType: 'shortcut', filterTargetValue: 'ayi_home_quick', source: 'service_modules.shortcut', fields: [
            ['title', '名称'],
            ['summary', '说明', 'textarea'],
            ['targetType', '跳转目标', 'select', ['ayi_profile', 'ayi_orders', 'ayi_applications', 'none']],
            ['sort', '排序', 'number'],
            ['visible', '是否显示', 'boolean']
          ] },
          { key: 'profile-prompt', title: '完善资料提示区', desc: '维护提示标题、说明、资料按钮文案、证件按钮文案和显示状态。', route: 'company-services/home/ayi/profile-prompt', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'ayi_home_profile_prompt', source: 'service_modules.highlight', fields: [
            ['title', '标题'],
            ['summary', '说明', 'textarea'],
            ['iconText', '资料按钮文案'],
            ['targetValue', '证件按钮文案'],
            ['visible', '是否显示', 'boolean']
          ] },
          { key: 'function-nav', title: '功能导航', desc: '维护工作、我的接单、实名认证等导航入口。', route: 'company-services/home/ayi/function-nav', kind: 'serviceModules', moduleType: 'shortcut', filterTargetValue: 'ayi_home_nav', source: 'service_modules.shortcut', fields: [
            ['title', '名称'],
            ['targetType', '跳转目标', 'select', ['service', 'ayi_orders', 'ayi_profile', 'ayi_certificates', 'none']],
            ['sort', '排序', 'number'],
            ['visible', '是否显示', 'boolean']
          ] },
          { key: 'recommended-jobs', title: '推荐工作区域', desc: '维护区域标题、查看更多文案、展示数量和显示状态；工作数据复用客户需求。', route: 'company-services/home/ayi/recommended-jobs', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'ayi_home_recommended_jobs', source: 'service_modules.highlight + demands', fields: [
            ['title', '区域标题'],
            ['iconText', '查看更多文案'],
            ['targetValue', '展示数量'],
            ['visible', '是否显示', 'boolean']
          ] }
        ]
      }
    ]
  },
  {
    key: 'service-page',
    route: 'company-services/service-page',
    title: '服务页配置',
    desc: '按服务页实际页面继续下钻到客户服务页配置，避免混合显示客户端和阿姨端数据。',
    cards: [
      {
        key: 'customer-service-page',
        title: '客户服务页',
        desc: '只维护客户身份服务页的搜索顶部、功能入口、服务类型、筛选条件和阿姨列表展示规则。',
        route: 'company-services/service-page/customer',
        kind: 'page',
        source: 'customer-service-page',
        cards: [
          { key: 'search-top', title: '搜索与顶部配置', desc: '维护搜索框提示、页面顶部说明和显示状态；城市读取公共信息配置。', route: 'company-services/service-page/customer/search-top', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'customer_service_search_top', source: 'service_modules.highlight + company_profile', fields: [
            ['title', '搜索框提示文字'],
            ['summary', '页面顶部说明', 'textarea'],
            ['visible', '是否显示', 'boolean']
          ] },
          { key: 'customer-actions', title: '客户功能入口', desc: '维护发布需求、好阿姨严选、做饭好吃、养老护理等功能卡片。', route: 'company-services/service-page/customer/actions', kind: 'serviceModules', moduleType: 'shortcut', filterTargetValue: 'customer_service_actions', source: 'service_modules.shortcut', fields: [
            ['title', '名称'],
            ['summary', '说明', 'textarea'],
            ['iconImage', '图标或图片', 'image'],
            ['targetType', '跳转或筛选目标', 'select', ['demand', 'find_ayi', 'service', 'store', 'about', 'none']],
            ['targetValue', '筛选参数'],
            ['sort', '排序', 'number'],
            ['visible', '是否显示', 'boolean']
          ] },
          { key: 'filters', title: '筛选条件', desc: '维护从业年限、价格、人气、综合筛选等前端已有筛选项显示。', route: 'company-services/service-page/customer/filters', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'customer_service_filter', source: 'service_modules.highlight', fields: [
            ['title', '名称'],
            ['sort', '排序', 'number'],
            ['visible', '是否显示', 'boolean']
          ] },
          { key: 'ayi-list', title: '阿姨列表展示', desc: '只配置列表展示规则，阿姨真实资料继续复用阿姨管理。显示项配置可填写逗号分隔值：rating,age,experience,hometown,intro,salary,schedule。', route: 'company-services/service-page/customer/ayi-list', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'customer_service_ayi_list', source: 'service_modules.highlight + ayis', fields: [
            ['title', '配置名称'],
            ['iconText', '显示项配置'],
            ['summary', '空列表提示文字', 'textarea'],
            ['visible', '是否显示列表', 'boolean']
          ] }
        ]
      },
      {
        key: 'ayi-service-page',
        title: '阿姨服务页',
        desc: '只维护阿姨身份服务页的顶部入口、找工作说明、工作列表展示和接单操作文案；服务类型读取统一家政服务类型。',
        route: 'company-services/service-page/ayi',
        kind: 'page',
        source: 'ayi-service-page',
        cards: [
          { key: 'top-actions', title: '顶部功能入口', desc: '维护加入阳光北亚、实名认证等入口，复用个人资料和证件页面。', route: 'company-services/service-page/ayi/top-actions', kind: 'serviceModules', moduleType: 'shortcut', filterTargetValue: 'ayi_service_top_actions', source: 'service_modules.shortcut', fields: [
            ['title', '名称'],
            ['summary', '说明', 'textarea'],
            ['targetType', '跳转目标', 'select', ['ayi_profile', 'ayi_certificates', 'none']],
            ['sort', '排序', 'number'],
            ['visible', '是否显示', 'boolean']
          ] },
          { key: 'job-top', title: '找工作顶部说明', desc: '维护小标题、主标题、说明文字、完善资料按钮和上传证件按钮文案。', route: 'company-services/service-page/ayi/job-top', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'ayi_service_job_top', source: 'service_modules.highlight', fields: [
            ['iconText', '小标题'],
            ['title', '主标题'],
            ['summary', '说明文字', 'textarea'],
            ['targetType', '完善资料按钮文案'],
            ['targetValue', '上传证件按钮文案'],
            ['visible', '是否显示', 'boolean']
          ] },
          { key: 'job-list', title: '工作列表展示', desc: '只配置工作列表展示规则，真实工作数据继续复用客户需求。显示项配置可填写逗号分隔值：serviceType,budget,address,startTime,status,familyInfo。', route: 'company-services/service-page/ayi/job-list', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'ayi_service_job_list', source: 'service_modules.highlight + demands', fields: [
            ['title', '配置名称'],
            ['iconText', '显示项配置'],
            ['summary', '空列表提示文字', 'textarea'],
            ['visible', '是否显示列表', 'boolean']
          ] },
          { key: 'apply-action', title: '接单操作配置', desc: '只维护申请按钮、已申请按钮、资料提示、成功提示和按钮显示规则，不修改真实申请记录。', route: 'company-services/service-page/ayi/apply-action', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'ayi_service_apply_action', source: 'service_modules.highlight + applications', fields: [
            ['title', '申请按钮文案'],
            ['iconText', '已申请按钮文案'],
            ['summary', '未完善资料提示', 'textarea'],
            ['targetValue', '申请成功提示'],
            ['visible', '是否允许显示申请按钮', 'boolean']
          ] }
        ]
      }
    ]
  },
  {
    key: 'stores-page',
    route: 'company-services/stores-page',
    title: '门店页配置',
    desc: '门店页配置只保留页面筛选和操作文案；真实门店资料统一在独立“门店信息”中维护。',
    cards: [
      { key: 'page-filter', title: '页面与筛选配置', desc: '维护城市、搜索提示、区域筛选、可住宿筛选和空列表提示。', route: 'company-services/stores-page/page-filter', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'stores_page_filter', source: 'service_modules.highlight', fields: [
        ['title', '城市名称'],
        ['iconText', '搜索框提示文字'],
        ['summary', '区域筛选选项，逗号分隔', 'textarea'],
        ['targetType', '是否显示可住宿筛选', 'select', ['true', 'false']],
        ['targetValue', '空列表提示文字'],
        ['visible', '是否显示', 'boolean']
      ] },
      { key: 'actions', title: '门店操作配置', desc: '维护导航、电话、详情和导航未接入提示等按钮文案与显示规则。', route: 'company-services/stores-page/actions', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'stores_page_actions', source: 'service_modules.highlight', fields: [
        ['title', '导航按钮文案'],
        ['iconText', '电话按钮文案'],
        ['summary', '门店详情提示文案', 'textarea'],
        ['targetValue', '导航未接入时的提示文案'],
        ['targetType', '是否显示导航按钮', 'select', ['true', 'false']],
        ['visible', '是否显示电话按钮', 'boolean']
      ] }
    ]
  },
  {
    key: 'about-page',
    route: 'company-services/about-page',
    title: '公司介绍配置',
    desc: '公司介绍页复用公司基础信息、服务类型和门店资料，不重复保存同一份资料。',
    cards: [
      { key: 'intro', title: '页面标题', desc: '只维护公司介绍页标题和显示状态；公司名称、Logo 和简介正文读取公共信息配置。', route: 'company-services/about-page/intro', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'about_company_intro', source: 'service_modules.highlight + company_profile', fields: [
        ['title', '页面标题'],
        ['visible', '是否显示', 'boolean']
      ] },
      { key: 'service-flow', title: '服务流程', desc: '维护公司介绍页服务流程，和客户首页服务流程使用不同分组，互不串数据。', route: 'company-services/about-page/service-flow', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'about_service_flow', source: 'service_modules.highlight', fields: [
        ['iconText', '步骤编号'],
        ['title', '标题'],
        ['summary', '说明', 'textarea'],
        ['sort', '排序', 'number'],
        ['visible', '是否显示', 'boolean']
      ] },
      { key: 'service-guarantee', title: '服务保障', desc: '维护保障标题、说明、排序和显示状态。', route: 'company-services/about-page/service-guarantee', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'about_service_guarantee', source: 'service_modules.highlight', fields: [
        ['title', '保障标题'],
        ['summary', '保障说明', 'textarea'],
        ['sort', '排序', 'number'],
        ['visible', '是否显示', 'boolean']
      ] },
      { key: 'customer-service', title: '客服咨询', desc: '维护客服咨询标题、说明和按钮文案；联系电话继续读取公共信息配置。', route: 'company-services/about-page/customer-service', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'about_customer_service', source: 'service_modules.highlight + company_profile', fields: [
        ['title', '标题'],
        ['summary', '说明文字', 'textarea'],
        ['iconText', '按钮文案'],
        ['visible', '是否显示', 'boolean']
      ] }
    ]
  },
  {
    key: 'mine-page',
    route: 'company-services/mine-page',
    title: '我的页面配置',
    desc: '我的页面只管理辅助入口和提示文案，不编辑真实业务数据。',
    cards: [
      {
        key: 'customer-mine',
        title: '客户“我的”',
        desc: '只维护客户身份“我的”页面的顶部、快捷入口、提示横幅、需求空状态和预约空状态。',
        route: 'company-services/mine-page/customer',
        kind: 'page',
        source: 'customer-mine-page',
        cards: [
          { key: 'top-user', title: '顶部用户区域', desc: '维护页面标题、身份说明、提示文字和显示状态；默认品牌图标读取公共信息配置。', route: 'company-services/mine-page/customer/top-user', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'customer_mine_top_user', source: 'service_modules.highlight + company_profile', fields: [
            ['title', '页面标题'],
            ['iconText', '身份说明'],
            ['summary', '页面提示文字', 'textarea'],
            ['visible', '是否显示', 'boolean']
          ] },
          { key: 'shortcuts', title: '客户快捷入口', desc: '维护发布需求、找阿姨、联系客服、切换身份等入口。', route: 'company-services/mine-page/customer/shortcuts', kind: 'serviceModules', moduleType: 'shortcut', filterTargetValue: 'customer_mine_shortcuts', source: 'service_modules.shortcut + company_profile', fields: [
            ['title', '名称'],
            ['iconImage', '图标', 'image'],
            ['targetType', '跳转目标', 'select', ['demand', 'find_ayi', 'customer_service', 'switch_role', 'service', 'about', 'none']],
            ['sort', '排序', 'number'],
            ['visible', '是否显示', 'boolean']
          ] },
          { key: 'tip-banner', title: '客户提示横幅', desc: '维护提示文字和显示状态。', route: 'company-services/mine-page/customer/tip-banner', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'customer_mine_tip_banner', source: 'service_modules.highlight', fields: [
            ['summary', '提示文字', 'textarea'],
            ['visible', '是否显示', 'boolean']
          ] },
          { key: 'demands', title: '我的需求区域', desc: '只配置需求区域标题和空状态，真实需求数据继续复用客户需求。', route: 'company-services/mine-page/customer/demands', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'customer_mine_demands', source: 'service_modules.highlight + demands', fields: [
            ['title', '区域标题'],
            ['iconText', '空状态标题'],
            ['summary', '空状态说明', 'textarea'],
            ['targetValue', '空状态按钮文案'],
            ['visible', '是否显示', 'boolean']
          ] },
          { key: 'appointments', title: '我的预约区域', desc: '只配置预约区域标题和空状态，真实预约数据继续复用预约记录。', route: 'company-services/mine-page/customer/appointments', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'customer_mine_appointments', source: 'service_modules.highlight + appointments', fields: [
            ['title', '区域标题'],
            ['iconText', '空状态标题'],
            ['summary', '空状态说明', 'textarea'],
            ['targetValue', '空状态按钮文案'],
            ['visible', '是否显示', 'boolean']
          ] }
        ]
      },
      {
        key: 'ayi-mine',
        title: '阿姨“我的”',
        desc: '只维护阿姨身份“我的”页面的顶部、快捷入口、审核提示、接单申请空状态和提示横幅。',
        route: 'company-services/mine-page/ayi',
        kind: 'page',
        source: 'ayi-mine-page',
        cards: [
          { key: 'top-user', title: '顶部用户区域', desc: '维护页面标题、身份说明、提示文字和显示状态；默认品牌图标读取公共信息配置。', route: 'company-services/mine-page/ayi/top-user', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'ayi_mine_top_user', source: 'service_modules.highlight + company_profile', fields: [
            ['title', '页面标题'],
            ['iconText', '身份说明'],
            ['summary', '页面提示文字', 'textarea'],
            ['visible', '是否显示', 'boolean']
          ] },
          { key: 'shortcuts', title: '阿姨快捷入口', desc: '维护我的资料、我的证件、找工作、我的接单/申请、联系客服、切换身份等入口。', route: 'company-services/mine-page/ayi/shortcuts', kind: 'serviceModules', moduleType: 'shortcut', filterTargetValue: 'ayi_mine_shortcuts', source: 'service_modules.shortcut + company_profile', fields: [
            ['title', '名称'],
            ['iconImage', '图标', 'image'],
            ['targetType', '跳转目标', 'select', ['ayi_profile', 'ayi_certificates', 'service', 'ayi_orders', 'ayi_applications', 'customer_service', 'switch_role', 'none']],
            ['sort', '排序', 'number'],
            ['visible', '是否显示', 'boolean']
          ] },
          { key: 'review-status', title: '资料审核区域', desc: '只配置资料审核提示文案，真实资料、证件和审核状态继续复用阿姨资料。', route: 'company-services/mine-page/ayi/review-status', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'ayi_mine_review_status', source: 'service_modules.highlight + ayis', fields: [
            ['title', '区域标题'],
            ['iconText', '未完善资料提示'],
            ['summary', '审核中提示', 'textarea'],
            ['targetType', '审核通过提示'],
            ['targetValue', '审核未通过提示与操作按钮文案'],
            ['visible', '是否显示', 'boolean']
          ] },
          { key: 'orders-applications', title: '我的接单与申请区域', desc: '只配置接单和申请区域标题及空状态，真实记录继续复用现有业务数据。', route: 'company-services/mine-page/ayi/orders-applications', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'ayi_mine_orders_applications', source: 'service_modules.highlight + applications + orders', fields: [
            ['title', '区域标题'],
            ['iconText', '空状态标题'],
            ['summary', '空状态说明', 'textarea'],
            ['targetValue', '空状态按钮文案'],
            ['visible', '是否显示', 'boolean']
          ] },
          { key: 'tip-banner', title: '阿姨提示横幅', desc: '维护提示文字、跳转按钮文案、跳转目标和显示状态。', route: 'company-services/mine-page/ayi/tip-banner', kind: 'serviceModules', moduleType: 'highlight', filterTargetType: 'ayi_mine_tip_banner', source: 'service_modules.highlight', fields: [
            ['summary', '提示文字', 'textarea'],
            ['iconText', '跳转按钮文案'],
            ['targetValue', '跳转目标'],
            ['visible', '是否显示', 'boolean']
          ] }
        ]
      }
    ]
  }
];


const companyServiceFeatureRoutes = new Map();
function collectCompanyServiceCards(page, cards = page.cards || []) {
  cards.forEach((card) => {
    const feature = Object.assign({ page }, card);
    companyServiceFeatureRoutes.set(card.route, feature);
    if (Array.isArray(card.cards)) {
      collectCompanyServiceCards(card, card.cards);
    }
  });
}
companyServicePages.forEach((page) => collectCompanyServiceCards(page));
companyServicePages
  .filter((page) => page.kind === 'serviceModules')
  .forEach((page) => {
    companyServiceFeatureRoutes.set(page.route, Object.assign({
      page: { route: 'company-services', title: '公司服务' }
    }, page));
  });

const legacyCompanyServiceRedirects = {
  'company-services/home/customer/service-types': 'company-services/service-types',
  'company-services/service-page/customer/service-types': 'company-services/service-types',
  'company-services/service-page/ayi/service-types': 'company-services/service-types',
  'company-services/about-page/service-scope': 'company-services/service-types',
  'company-services/home/customer/featured-ayis': 'ayis',
  'company-services/stores-page/store-list': 'stores',
  'company-services/about-page/stores': 'stores',
  'company-services/about-page/contact': 'company-services/common-info'
};

const serviceModuleSections = Array.from(companyServiceFeatureRoutes.values())
  .filter((card) => card.kind === 'serviceModules')
  .map((card) => {
    const preset = serviceModuleFieldPresets[card.moduleType];
    return {
      key: card.key,
      route: card.route,
      pageRoute: card.page.route,
      moduleType: preset.moduleType,
      title: card.title,
      desc: card.desc,
      filterTargetType: card.filterTargetType || '',
      filterTargetValue: card.filterTargetValue || '',
      fields: card.fields || preset.fields
    };
  });

function displayRoleName(role) {
  return roleDisplayMap[role] || role || '-';
}

function normalizeRoleForSave(role) {
  return rolePersistMap[role] || role;
}

const list = document.querySelector('#list');
const form = document.querySelector('#form');
const editor = document.querySelector('.editor');
const layout = document.querySelector('.layout');
const sectionTitle = document.querySelector('#sectionTitle');
const sectionDesc = document.querySelector('#sectionDesc');
const formTitle = document.querySelector('#formTitle');
const loginForm = document.querySelector('#loginForm');
const loginTip = document.querySelector('#loginTip');
const currentUserLabel = document.querySelector('#currentUser');
const backHomeBtn = document.querySelector('#backHomeBtn');
const topPageTitle = document.querySelector('#topPageTitle');
const topBreadcrumb = document.querySelector('#topBreadcrumb');
const currentOrgLabel = document.querySelector('#currentOrg');
const notificationCount = document.querySelector('#notificationCount');
const accountMenuBtn = document.querySelector('#accountMenuBtn');
const accountDropdown = document.querySelector('#accountDropdown');
const mobileNavToggle = document.querySelector('#mobileNavToggle');
const sidebarProfileBtn = document.querySelector('#sidebarProfileBtn');
const sidebarLogoutBtn = document.querySelector('#sidebarLogoutBtn');

const roleAccess = {
  boss: ['dashboard', 'accounts', 'auditLogs', 'exportInfo', 'todos', 'companyProfile', 'ayis', 'demands', 'appointments', 'applications', 'orders', 'orderDispatches', 'stores', 'serviceModules', 'banners'],
  operator: ['exportInfo', 'todos', 'ayis', 'demands', 'appointments', 'applications', 'orders', 'orderDispatches', 'stores', 'serviceModules', 'banners']
};

const demandCategories = [
  {
    key: 'pending',
    label: '\u5f85\u5904\u7406',
    hint: '\u65b0\u63d0\u4ea4\u6216\u5c1a\u672a\u8fdb\u5165\u8ddf\u8fdb\u7684\u9700\u6c42',
    statuses: ['\u5f85\u5904\u7406', '\u5f85\u8ddf\u8fdb', '\u987e\u95ee\u5f85\u8054\u7cfb']
  },
  {
    key: 'contacted',
    label: '\u5df2\u8054\u7cfb',
    hint: '\u5df2\u5b8c\u6210\u521d\u6b65\u6c9f\u901a\u7684\u9700\u6c42',
    statuses: ['\u5df2\u8054\u7cfb']
  },
  {
    key: 'matching',
    label: '\u5339\u914d\u4e2d',
    hint: '\u6b63\u5728\u63a8\u8350\u6216\u7b5b\u9009\u963f\u59e8',
    statuses: ['\u5339\u914d\u4e2d', '\u5f85\u5339\u914d', '\u5df2\u63a8\u8350']
  },
  {
    key: 'matched',
    label: '\u5df2\u5339\u914d',
    hint: '\u5df2\u786e\u8ba4\u5339\u914d\u6216\u5df2\u9762\u8bd5\u6210\u4ea4',
    statuses: ['\u5df2\u5339\u914d', '\u5df2\u9762\u8bd5', '\u5df2\u6210\u4ea4']
  },
  {
    key: 'closed',
    label: '\u5df2\u5173\u95ed',
    hint: '\u5df2\u53d6\u6d88\u3001\u5173\u95ed\u6216\u4e0d\u518d\u7ee7\u7eed\u8ddf\u8fdb',
    statuses: ['\u5df2\u5173\u95ed', '\u5df2\u53d6\u6d88']
  }
];

const ayiCategories = [
  {
    key: 'verified',
    label: '\u5df2\u8ba4\u8bc1',
    hint: '\u5ba1\u6838\u901a\u8fc7\u4e14\u5df2\u4e0a\u67b6\u5c55\u793a',
    match: (item) => item.visible !== false && isCertifiedAyiStatus(item.status)
  },
  {
    key: 'pending',
    label: '\u5f85\u5ba1\u6838',
    hint: '\u5c1a\u672a\u8ba4\u8bc1\u6216\u8ba4\u8bc1\u672a\u901a\u8fc7',
    match: (item) => item.visible !== false && !isCertifiedAyiStatus(item.status)
  },
  {
    key: 'downlisted',
    label: '\u5df2\u4e0b\u67b6',
    hint: '\u4e0d\u5728\u5c0f\u7a0b\u5e8f\u516c\u5f00\u5c55\u793a',
    match: (item) => item.visible === false
  }
];

const interviewStatuses = ['待安排', '待面试', '面试中', '已面试', '跟进中', '已完成', '已取消'];
const unfinishedInterviewStatuses = ['待安排', '待面试', '面试中', '已面试', '跟进中'];
let appointmentStatusFilter = 'all';
let appointmentDemandFilter = '';

const accountGroups = [
  {
    role: '运营端',
    title: '后台运营端账号',
    entry: '后台管理',
    desc: '员工进入后台，维护阿姨、客户需求、面试、接单、门店和公司内容。'
  },
  {
    role: '管理端',
    title: '管理端账号',
    entry: '后台管理',
    desc: '管理端进入后台，查看全部数据、管理看板、订单和账号权限。'
  }
];

const imageTips = {
  image: '建议上传清晰正面照片，后续用于小程序阿姨列表和详情页展示。',
  idCardImage: '用于后台身份核验，正式版会上传到云存储并限制权限查看。',
  healthCertImage: '用于健康证审核，正式版会记录有效期和审核状态。',
  skillCertImage: '可上传月嫂证、育婴师证、护工证等技能证书。',
  managerImage: '用于门店详情页店长卡片展示，当前本地 MVP 可保存为 base64 图片。',
  default: '建议上传横图，后续小程序可用于卡片展示。'
};

function normalizeValue(key, value) {
  if (['skills', 'tags', 'permissions'].includes(key)) {
    return String(value || '').split(',').map((text) => text.trim()).filter(Boolean);
  }
  if (['canStay', 'visible', 'featured'].includes(key)) {
    return value === true || value === 'true';
  }
  if (['age', 'experience', 'sort', 'demandId', 'orderId', 'storeId', 'staffCount', 'consultantCount', 'ayiCount', 'latitude', 'longitude'].includes(key)) {
    return Number(value) || 0;
  }
  return value;
}

function displayModuleType(value) {
  const map = {
    highlight: '服务说明',
    service: '家政服务',
    shortcut: '首页快捷入口'
  };
  return map[value] || value || '服务说明';
}

function displaySelectOption(key, option) {
  if (key === 'moduleType') return displayModuleType(option);
  const targetMap = {
    none: '无跳转',
    find_ayi: '找阿姨',
    demand: '发布需求',
    customer_service: '客服咨询',
    about: '公司介绍',
    service: '服务页',
    store: '门店',
    ayi_profile: '个人资料',
    ayi_orders: '我的接单',
    ayi_applications: '我的申请',
    ayi_certificates: '我的证件',
    switch_role: '切换身份'
  };
  if (key === 'targetType') return targetMap[option] || option;
  return option;
}

function parseHashRoute() {
  const raw = (location.hash || '#/home').replace(/^#\/?/, '') || 'home';
  const [route, query = ''] = raw.split('?');
  const params = {};
  query.split('&').filter(Boolean).forEach((part) => {
    const [key, value = ''] = part.split('=');
    if (!key) return;
    params[decodeURIComponent(key)] = decodeURIComponent(value);
  });
  return {
    route: route || 'home',
    params
  };
}

function routeWithCategory(resource, key) {
  const route = resourceToRouteMap[resource] || resource;
  if (!key) return route;
  if (resource === 'demands') return `demands-list?status=${encodeURIComponent(key)}`;
  const param = resource === 'demands' ? 'status' : 'category';
  return `${route}?${param}=${encodeURIComponent(key)}`;
}

function isCertifiedAyiStatus(status) {
  return ['\u5df2\u8ba4\u8bc1', 'approved'].includes(status);
}

function getCategoriesForResource(resource) {
  if (resource === 'demands') return demandCategories;
  if (resource === 'ayis') return ayiCategories;
  return null;
}

function getCategoryKeyFromRoute(resource, params = {}) {
  if (resource === 'demands') return params.status || '';
  if (resource === 'ayis') return params.category || '';
  return '';
}

function demandCategoryForRecord(item) {
  const status = item.status || '';
  return demandCategories.find((category) => category.statuses.includes(status)) || null;
}

function recordMatchesCategory(resource, category, item) {
  if (!category) return true;
  if (resource === 'demands') return demandCategoryForRecord(item)?.key === category.key;
  if (resource === 'ayis') return category.match(item);
  return true;
}

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateRangeByPreset(preset) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start);
  if (preset === 'today') return { startDate: localDateString(start), endDate: localDateString(end) };
  if (preset === 'last7') {
    start.setDate(start.getDate() - 6);
    return { startDate: localDateString(start), endDate: localDateString(end) };
  }
  if (preset === 'last30') {
    start.setDate(start.getDate() - 29);
    return { startDate: localDateString(start), endDate: localDateString(end) };
  }
  if (preset === 'month') {
    start.setDate(1);
    return { startDate: localDateString(start), endDate: localDateString(end) };
  }
  return { startDate: '', endDate: '' };
}

function getResourceDateFilter(resource) {
  return resourceDateFilters[resource] || { preset: 'all', startDate: '', endDate: '' };
}

function recordMatchesDateFilter(item, filter) {
  if (!filter || filter.preset === 'all') return true;
  const created = formatDateOnly(item.createdAt);
  if (!created) return false;
  if (filter.startDate && created < filter.startDate) return false;
  if (filter.endDate && created > filter.endDate) return false;
  return true;
}

function getFilteredCache() {
  const categoryFiltered = currentModuleCategory
    ? cache.filter((item) => recordMatchesCategory(currentResource, currentModuleCategory, item))
    : cache;
  if (!['demands', 'ayis', 'appointments'].includes(currentResource)) return categoryFiltered;
  const dateFiltered = categoryFiltered.filter((item) => recordMatchesDateFilter(item, getResourceDateFilter(currentResource)));
  const demandFiltered = currentResource === 'appointments' && appointmentDemandFilter
    ? dateFiltered.filter((item) => String(item.demandId || '') === String(appointmentDemandFilter))
    : dateFiltered;
  if (currentResource !== 'appointments' || appointmentStatusFilter === 'all') return demandFiltered;
  if (appointmentStatusFilter === 'unfinished') {
    return demandFiltered.filter((item) => unfinishedInterviewStatuses.includes(item.status || ''));
  }
  return demandFiltered.filter((item) => (item.status || '') === appointmentStatusFilter);
}

function isSearchableCategoryResource(resource) {
  return ['demands', 'ayis', 'appointments'].includes(resource);
}

function getSearchableRecordText(resource, item) {
  const values = resource === 'ayis'
    ? [
        item.name,
        item.phone,
        item.source,
        item.age,
        item.hometown,
        item.serviceType,
        item.experience,
        item.liveType,
        item.salary,
        item.availableTime,
        Array.isArray(item.skills) ? item.skills.join(' ') : item.skills,
        item.status,
        item.intro,
        item.storeId,
        item.featuredTitle
      ]
    : resource === 'appointments'
      ? [
          item.customerName,
          item.phone,
          item.ayiName,
          item.serviceType,
          item.date,
          item.address,
          item.interviewMethod,
          item.interviewResult,
          item.nextStep,
          item.consultant,
          item.status,
          item.note,
          item.demandId,
          item.ayiId
        ]
    : [
        item.customerName,
        item.phone,
        item.source,
        item.serviceType,
        item.city,
        item.address,
        item.startTime,
        item.budget,
        item.familyInfo,
        item.consultant,
        item.followNote,
        item.status
      ];
  return values.filter((value) => value !== undefined && value !== null).join(' ').toLowerCase();
}

function recordMatchesSearch(resource, item, query) {
  if (!query) return true;
  return getSearchableRecordText(resource, item).includes(query);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getStatusClass(status) {
  if (['已认证', '已匹配', '客户已确认', '已面试', '已成交', '启用', true].includes(status)) return 'ok';
  if (['已下架', '已关闭', '已失效', '客户已拒绝', '已取消', '停用', false].includes(status)) return 'off';
  return '';
}

async function api(path, options) {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  const response = await fetch(`/api/${path}`, {
    headers,
    ...options
  });
  if (!response.ok) {
    if (response.status === 401 && path !== 'auth/login') {
      clearAuth('登录已过期，请重新登录。');
    }
    throw new Error(await response.text());
  }
  return response.status === 204 ? null : response.json();
}

function clearAuth(message = '') {
  currentUser = null;
  authToken = null;
  allowedResources = [];
  localStorage.removeItem('ygby_auth_token');
  document.body.classList.remove('is-authed');
  loginTip.textContent = message;
}

function getAllowedResources() {
  if (allowedResources.length) return allowedResources.filter((item) => resources[item]);
  if (!currentUser) return [];
  return roleAccess[currentUser.role] || [];
}

function getRouteFromHash() {
  return parseHashRoute().route;
}

function getServiceModuleSectionByRoute(route) {
  return serviceModuleSections.find((section) => section.route === route) || null;
}

function getServiceModuleSectionByType(moduleType) {
  return serviceModuleSections.find((section) => section.moduleType === moduleType) || null;
}

function getCompanyServicePageByRoute(route) {
  return companyServicePages.find((page) => page.route === route && page.kind !== 'serviceModules') || null;
}

function getCompanyServiceFeatureByRoute(route) {
  return companyServiceFeatureRoutes.get(route) || null;
}

function renderCompanyServiceBackLinks(pageRoute = 'company-services') {
  return `
    <div class="category-list-header">
      <button class="secondary" data-action="route-card" data-route="${escapeHtml(pageRoute)}">返回上一级</button>
      <button class="secondary" data-action="route-card" data-route="company-services">返回公司服务</button>
    </div>
  `;
}

function getCurrentFields() {
  if (currentResource === 'serviceModules') {
    const section = getServiceModuleSectionByRoute(currentRoute) || getServiceModuleSectionByType(currentRecord && currentRecord.moduleType);
    if (section) return section.fields;
  }
  return resources[currentResource].fields || [];
}

function getServiceModuleApiPath(id = '') {
  const section = getServiceModuleSectionByRoute(currentRoute);
  const suffix = section ? `moduleType=${encodeURIComponent(section.moduleType)}` : '';
  const base = id ? `serviceModules/${id}` : 'serviceModules';
  return suffix ? `${base}?${suffix}` : base;
}

function setRoute(route) {
  const next = `#/${route || 'home'}`;
  if (location.hash === next) {
    renderRoute();
    return;
  }
  location.hash = next;
}

function markActiveRoute(route) {
  document.body.classList.toggle('route-home', route === 'home');
  document.body.classList.toggle('route-module', route !== 'home');
  const activeRoute = route.startsWith('company-services/') ? 'company-services' : route;
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.route === activeRoute);
  });
}

function applyAuthShell() {
  if (!currentUser || !roleAccess[currentUser.role]) {
    document.body.classList.remove('is-authed');
    return;
  }

  document.body.classList.add('is-authed');
  currentUserLabel.textContent = `${currentUser.username || currentUser.phone} / ${displayRoleName(currentUser.role)}`;
  const allowed = getAllowedResources();
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.hidden = tab.dataset.route !== 'home' && !allowed.includes(tab.dataset.resource);
  });
}

async function loadResource(resource = currentResource, options = {}) {
  const allowed = getAllowedResources();
  if (currentUser && allowed.length && !allowed.includes(resource)) {
    renderHome();
    return;
  }
  currentResource = resource;
  currentRoute = options.route || resourceToRouteMap[resource] || resource;
  currentRecord = null;
  const meta = resources[resource];
  const categories = getCategoriesForResource(resource);
  const hasCategoryOption = Object.prototype.hasOwnProperty.call(options, 'categoryKey');
  const categoryKey = hasCategoryOption
    ? options.categoryKey
    : (currentModuleCategory && currentModuleCategory.resource === resource ? currentModuleCategory.key : '');
  const selectedCategory = categories ? categories.find((item) => item.key === categoryKey) : null;
  currentModuleCategory = selectedCategory ? Object.assign({ resource }, selectedCategory) : null;
  const serviceSection = resource === 'serviceModules' ? getServiceModuleSectionByRoute(currentRoute) : null;
  const companyFeature = getCompanyServiceFeatureByRoute(currentRoute);
  const nextSearchKey = currentModuleCategory ? `${resource}:${currentModuleCategory.key}` : '';
  if (nextSearchKey !== currentModuleSearchKey) {
    currentModuleSearchKey = nextSearchKey;
    currentModuleSearchQuery = '';
  }
  sectionTitle.textContent = companyFeature ? companyFeature.title : (serviceSection ? serviceSection.title : meta.title);
  sectionDesc.textContent = companyFeature ? companyFeature.desc : (serviceSection ? serviceSection.desc : meta.desc);
  formTitle.textContent = `新增${companyFeature ? companyFeature.title : (serviceSection ? serviceSection.title : meta.title)}`;
  document.querySelector('#addBtn').hidden = Boolean(meta.custom);
  closeEditor();
  markActiveRoute(currentRoute);
  if (meta.custom === 'dashboard') {
    await loadDashboard();
    renderDashboard(dashboardData || {});
    form.innerHTML = '<p class="muted">管理看板为管理端查看页，不需要在右侧编辑。</p>';
    formTitle.textContent = '看板说明';
    return;
  }
  if (meta.custom === 'auditLogs') {
    await loadAuditLogs();
    renderAuditLogs();
    form.innerHTML = '<p class="muted">\u64cd\u4f5c\u8bb0\u5f55\u4ec5\u7ba1\u7406\u7aef\u53ef\u89c1\uff0c\u8bb0\u5f55\u6765\u81ea audit_logs\u3002</p>';
    formTitle.textContent = '\u5b89\u5168\u8bf4\u660e';
    return;
  }
  if (meta.custom === 'exportInfo') {
    await loadExportInfo();
    renderExportInfo();
    form.innerHTML = '<p class="muted">导出信息只按当前权限范围查询和导出，不允许输入数据库表名、人员 ID 或技术状态枚举。</p>';
    formTitle.textContent = '导出说明';
    return;
  }
  if (meta.custom === 'todos') {
    await loadTodos();
    renderTodos();
    form.innerHTML = '<p class="muted">今日待办按负责人和下次跟进时间生成，点击“进入客户详情”处理跟进。</p>';
    formTitle.textContent = '待办说明';
    return;
  }
  if (resource === 'accounts') {
    try {
      const result = await api('auth/miniprogram-users');
      miniprogramUsers = result.users || [];
    } catch (error) {
      miniprogramUsers = [];
    }
  }
  if (meta.custom === 'companyProfile') {
    const profile = await api('company-profile');
    cache = profile ? [profile] : [];
    renderCompanyProfile(profile || {});
    renderCompanyProfileForm(profile || {});
    editor.classList.add('is-open');
    layout.classList.add('editor-open');
    return;
  }
  cache = resource === 'serviceModules' && getServiceModuleSectionByRoute(currentRoute)
    ? await api(getServiceModuleApiPath())
    : await api(resource);
  if (resource === 'demands' && currentRoute === 'demands') {
    document.querySelector('#addBtn').hidden = true;
    renderDemandModuleHome();
    return;
  }
  if (categories && !selectedCategory) {
    document.querySelector('#addBtn').hidden = true;
    renderCategoryHome(resource);
    return;
  }
  renderList();
}

function renderServiceModulesHome() {
  currentResource = 'serviceModules';
  currentRoute = 'company-services';
  currentRecord = null;
  cache = [];
  closeEditor();
  markActiveRoute('company-services');
  sectionTitle.textContent = '公司服务';
  sectionDesc.textContent = '按小程序前端页面组织配置入口。页面配置只做分区导航，真实数据继续复用轮播、服务、门店、公司信息和阿姨管理。';
  document.querySelector('#addBtn').hidden = true;
  formTitle.textContent = '配置原则';
  form.innerHTML = '<p class="muted">每一级均为“页面入口 → 功能卡片 → 具体列表或编辑页”。服务类型、门店、公司电话和阿姨资料只保留一套数据源，不在页面配置中重复保存。</p>';
  const allowed = getAllowedResources();
  const visiblePages = companyServicePages.filter((page) => allowed.includes(page.resource || 'serviceModules'));
  list.innerHTML = `
    <div class="home-grid">
      ${visiblePages.map((page) => `
        <button class="module-card" data-action="route-card" data-route="${escapeHtml(page.route)}">
          <span>${escapeHtml(page.title)}</span>
          <small>${escapeHtml(page.desc)}</small>
        </button>
      `).join('')}
    </div>
  `;
}

function renderCompanyServicePage(page) {
  currentResource = 'serviceModules';
  currentRoute = page.route;
  currentRecord = null;
  cache = [];
  closeEditor();
  markActiveRoute(page.route);
  sectionTitle.textContent = page.title;
  sectionDesc.textContent = page.desc;
  document.querySelector('#addBtn').hidden = true;
  formTitle.textContent = '页面分区';
  form.innerHTML = `<p class="muted">${escapeHtml(page.title)} 只展示本页面相关功能卡片。点击卡片后进入对应的真实数据列表或编辑页。</p>`;
  const parentRoute = page.page ? page.page.route : 'company-services';
  const backLabel = page.page ? `返回${page.page.title}` : '返回公司服务';
  list.innerHTML = `
    <div class="category-list-header">
      <button class="secondary" data-action="route-card" data-route="${escapeHtml(parentRoute)}">${escapeHtml(backLabel)}</button>
      <div>
        <strong>${escapeHtml(page.title)}</strong>
        <span>${page.cards.length} 个功能卡片</span>
      </div>
    </div>
    <div class="home-grid">
      ${page.cards.map((card) => `
        <button class="module-card" data-action="route-card" data-route="${escapeHtml(card.route)}">
          <span>${escapeHtml(card.title)}</span>
          <small>${escapeHtml(card.desc)}</small>
        </button>
      `).join('')}
    </div>
  `;
}

async function renderCompanyServiceFeature(feature, params = {}) {
  if (feature.kind === 'page') {
    renderCompanyServicePage(feature);
    return;
  }

  if (feature.kind === 'homeHero') {
    await renderCustomerHomeHero(feature);
    return;
  }

  if (feature.kind === 'serviceModules') {
    const section = getServiceModuleSectionByRoute(feature.route);
    if (!section) {
      renderCompanyServiceNotice(feature);
      return;
    }
    if (params.item) {
      await renderServiceModuleItemPage(section, params.item);
    } else {
      await renderServiceModuleSectionHome(section);
    }
    return;
  }

  if (feature.kind === 'resource') {
    await loadResource(feature.resource, { route: feature.route });
    return;
  }

  renderCompanyServiceNotice(feature);
}

function parseJsonValue(value, fallback = {}) {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
}

async function renderCustomerHomeHero(feature) {
  currentResource = 'serviceModules';
  currentRoute = feature.route;
  currentRecord = null;
  cache = [];
  closeEditor();
  markActiveRoute(feature.route);
  sectionTitle.textContent = feature.title;
  sectionDesc.textContent = feature.desc;
  document.querySelector('#addBtn').hidden = true;
  formTitle.textContent = '编辑顶部主视觉';

  const records = await api('serviceModules?moduleType=highlight');
  const record = (records || []).find((item) => item.targetType === 'customer_home_hero') || null;
  const extra = parseJsonValue(record && record.targetValue, {});
  currentRecord = record;
  list.innerHTML = `
    ${renderCompanyServiceBackLinks(feature.page.route)}
    <article class="record">
      <div>
        <div class="record-title">${escapeHtml(record ? (record.title || '顶部主视觉') : '顶部主视觉暂未配置')}</div>
        <div class="record-line">城市、公司名称和 Logo：读取公共信息配置</div>
        <div class="record-line">副标题：${escapeHtml(record?.summary || '-')}</div>
        <div class="record-line">按钮：${escapeHtml(extra.primaryButtonText || '-')} / ${escapeHtml(extra.secondaryButtonText || '-')}</div>
      </div>
    </article>
  `;
  form.dataset.mode = 'customer-home-hero';
  form.innerHTML = `
    <div class="field"><label>主标题</label><input name="mainTitle" value="${escapeHtml(record?.title || '')}" /></div>
    <div class="field"><label>副标题</label><textarea name="subtitle">${escapeHtml(record?.summary || '')}</textarea></div>
    <div class="field"><label>主按钮文案</label><input name="primaryButtonText" value="${escapeHtml(extra.primaryButtonText || '')}" /></div>
    <div class="field"><label>主按钮跳转</label><select name="primaryButtonTarget">
      ${['demand', 'service', 'find_ayi', 'about', 'store', 'none'].map((value) => `<option value="${value}" ${extra.primaryButtonTarget === value ? 'selected' : ''}>${escapeHtml(displaySelectOption('targetType', value))}</option>`).join('')}
    </select></div>
    <div class="field"><label>副按钮文案</label><input name="secondaryButtonText" value="${escapeHtml(extra.secondaryButtonText || '')}" /></div>
    <div class="field"><label>副按钮跳转</label><select name="secondaryButtonTarget">
      ${['service', 'find_ayi', 'demand', 'about', 'store', 'none'].map((value) => `<option value="${value}" ${extra.secondaryButtonTarget === value ? 'selected' : ''}>${escapeHtml(displaySelectOption('targetType', value))}</option>`).join('')}
    </select></div>
    <div class="form-actions">
      <button type="submit">保存顶部主视觉</button>
    </div>
  `;
  editor.classList.add('is-open');
  layout.classList.add('editor-open');
}

function renderCompanyServiceNotice(feature) {
  currentRoute = feature.route;
  currentRecord = null;
  cache = [];
  closeEditor();
  markActiveRoute(feature.route);
  sectionTitle.textContent = feature.title;
  sectionDesc.textContent = feature.desc;
  document.querySelector('#addBtn').hidden = true;
  formTitle.textContent = '数据复用说明';
  form.innerHTML = '<p class="muted">本功能当前不单独创建内容表，避免复制真实业务数据。需要维护时请进入对应的数据来源模块。</p>';
  const actionButton = feature.targetRoute
    ? `<button data-action="route-card" data-route="${escapeHtml(feature.targetRoute)}">进入数据来源</button>`
    : '';
  list.innerHTML = `
    ${renderCompanyServiceBackLinks(feature.page.route)}
    <article class="record">
      <div>
        <div class="record-title">${escapeHtml(feature.title)}</div>
        <div class="record-line">${escapeHtml(feature.desc)}</div>
        <div class="record-line">数据来源：${escapeHtml(feature.source || '-')}</div>
      </div>
      <div class="record-actions">${actionButton}</div>
    </article>
  `;
}

async function renderServiceModuleSectionHome(section) {
  currentResource = 'serviceModules';
  currentRoute = section.route;
  currentRecord = null;
  closeEditor();
  markActiveRoute(section.route);
  sectionTitle.textContent = section.title;
  sectionDesc.textContent = `${section.desc} 点击一个小功能后进入单条查看和编辑。`;
  document.querySelector('#addBtn').hidden = section.moduleType === 'service' && !section.filterTargetType;
  formTitle.textContent = '页面说明';
  form.innerHTML = '<p class="muted">本页只显示当前模块下已有数据生成的小功能入口，不混入其他类型数据。</p>';
  cache = await api(getServiceModuleApiPath());
  if (section.filterTargetType) {
    cache = cache.filter((item) => item.targetType === section.filterTargetType);
  }
  if (section.filterTargetValue) {
    cache = cache.filter((item) => item.targetValue === section.filterTargetValue);
  }

  const cards = cache.map((item) => {
    const subtitle = item.moduleType === 'shortcut'
      ? displaySelectOption('targetType', item.targetType || 'none')
      : item.summary || item.iconText || '';
    return `
      <button class="module-card" data-action="route-card" data-route="${escapeHtml(`${section.route}?item=${item.id}`)}">
        <span>${escapeHtml(item.title || `记录 ${item.id}`)}</span>
        <small>${escapeHtml(subtitle || `排序 ${item.sort || 0}`)}</small>
      </button>
    `;
  }).join('');

  list.innerHTML = `
    <div class="category-list-header">
      <button class="secondary" data-action="route-card" data-route="${escapeHtml(section.pageRoute || 'company-services')}">返回上一级</button>
      <button class="secondary" data-action="route-card" data-route="company-services">返回公司服务</button>
      <div>
        <strong>${escapeHtml(section.title)}</strong>
        <span>${cache.length} 个小功能</span>
      </div>
    </div>
    <div class="home-grid">
      ${cards || '<p class="muted">当前模块暂无可编辑数据。</p>'}
    </div>
  `;
}

async function renderServiceModuleItemPage(section, itemId) {
  currentResource = 'serviceModules';
  currentRoute = section.route;
  currentRecord = null;
  closeEditor();
  markActiveRoute(section.route);
  sectionTitle.textContent = section.title;
  sectionDesc.textContent = '当前页面只编辑选中的这一条数据。';
  document.querySelector('#addBtn').hidden = true;

  const record = await api(getServiceModuleApiPath(itemId));
  const matchesSection = record
    && (!section.filterTargetType || record.targetType === section.filterTargetType)
    && (!section.filterTargetValue || record.targetValue === section.filterTargetValue);
  cache = matchesSection ? [record] : [];
  if (!matchesSection) {
    list.innerHTML = `
      <div class="category-list-header">
        <button class="secondary" data-action="route-card" data-route="${escapeHtml(section.route)}">返回上一级</button>
      </div>
      <p class="muted">没有找到该数据，可能已被删除或类型不匹配。</p>
    `;
    return;
  }

  list.innerHTML = `
    <div class="category-list-header">
      <button class="secondary" data-action="route-card" data-route="${escapeHtml(section.route)}">返回上一级</button>
      <button class="secondary" data-action="route-card" data-route="${escapeHtml(section.pageRoute || 'company-services')}">返回页面配置</button>
      <button class="secondary" data-action="route-card" data-route="company-services">返回公司服务</button>
      <div>
        <strong>${escapeHtml(record.title || `记录 ${record.id}`)}</strong>
        <span>${escapeHtml(displayModuleType(record.moduleType))}</span>
      </div>
    </div>
    <article class="record">
      <div>
        <div class="record-title">${escapeHtml(record.title || '-')}</div>
        <div class="record-line">${escapeHtml(record.summary || '-')}</div>
        <div class="record-line">排序：${escapeHtml(record.sort || 0)} / 显示：${escapeHtml(String(record.visible))}</div>
      </div>
    </article>
  `;

  renderForm(record);
  editor.classList.add('is-open');
  layout.classList.add('editor-open');
}

function renderHome() {
  currentRoute = 'home';
  currentRecord = null;
  currentModuleCategory = null;
  currentModuleSearchKey = '';
  currentModuleSearchQuery = '';
  cache = [];
  closeEditor();
  markActiveRoute('home');
  sectionTitle.textContent = '后台功能首页';
  sectionDesc.textContent = '选择一个功能模块进入独立页面视图。首页只展示入口，不加载业务列表。';
  document.querySelector('#addBtn').hidden = true;
  formTitle.textContent = '页面说明';
  form.innerHTML = '<p class="muted">点击左侧导航或下方入口卡片进入对应模块。进入模块后，只显示当前模块内容。</p>';

  const cards = getAllowedResources().filter((resource) => !['banners', 'companyProfile'].includes(resource)).map((resource) => {
    const meta = resources[resource];
    const route = resourceToRouteMap[resource] || resource;
    return `
      <button class="module-card" data-action="route-card" data-route="${escapeHtml(route)}">
        <span>${escapeHtml(meta.title)}</span>
        <small>${escapeHtml(meta.desc)}</small>
      </button>
    `;
  }).join('');

  list.innerHTML = `
    <div class="home-grid">
      ${cards || '<p class="muted">当前账号暂无可进入的后台模块。</p>'}
    </div>
  `;
}

async function renderRoute() {
  if (!currentUser || !roleAccess[currentUser.role]) return;
  const parsed = parseHashRoute();
  const route = parsed.route;
  if (route === 'appointments') {
    setRoute('demands-interviews');
    return;
  }
  if (route === 'company') {
    setRoute('company-services/common-info');
    return;
  }
  if (legacyCompanyServiceRedirects[route]) {
    setRoute(legacyCompanyServiceRedirects[route]);
    return;
  }
  if (route === 'home') {
    renderHome();
    return;
  }
  if (route === 'company-services') {
    if (!getAllowedResources().includes('serviceModules')) {
      setRoute('home');
      return;
    }
    renderServiceModulesHome();
    return;
  }
  const companyServicePage = getCompanyServicePageByRoute(route);
  if (companyServicePage) {
    const requiredResource = companyServicePage.resource || 'serviceModules';
    if (!getAllowedResources().includes(requiredResource)) {
      setRoute('home');
      return;
    }
    if (companyServicePage.kind === 'resource') {
      await loadResource(companyServicePage.resource, { route: companyServicePage.route });
      return;
    }
    renderCompanyServicePage(companyServicePage);
    return;
  }
  const companyServiceFeature = getCompanyServiceFeatureByRoute(route);
  if (companyServiceFeature) {
    const requiredResource = companyServiceFeature.resource || 'serviceModules';
    if (!getAllowedResources().includes(requiredResource)) {
      setRoute(companyServiceFeature.page.route);
      return;
    }
    await renderCompanyServiceFeature(companyServiceFeature, parsed.params);
    return;
  }
  const resource = routeToResourceMap[route];
  if (!resource) {
    setRoute('home');
    return;
  }
  const allowed = getAllowedResources();
  if (!allowed.includes(resource)) {
    setRoute('home');
    return;
  }
  const categories = getCategoriesForResource(resource);
  const categoryKey = getCategoryKeyFromRoute(resource, parsed.params);
  if (resource === 'serviceModules' && !getServiceModuleSectionByRoute(route)) {
    setRoute('company-services');
    return;
  }
  const serviceSection = resource === 'serviceModules' ? getServiceModuleSectionByRoute(route) : null;
  if (serviceSection) {
    if (parsed.params.item) {
      await renderServiceModuleItemPage(serviceSection, parsed.params.item);
    } else {
      await renderServiceModuleSectionHome(serviceSection);
    }
    return;
  }
  if (categories && categoryKey && !categories.some((item) => item.key === categoryKey)) {
    setRoute(route);
    return;
  }
  await loadResource(resource, { categoryKey, route });
}

function openEditor(record = null) {
  renderForm(record);
  editor.classList.add('is-open');
  layout.classList.add('editor-open');
  editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeEditor() {
  currentRecord = null;
  pendingImages = {};
  form.dataset.mode = '';
  form.dataset.demandId = '';
  editor.classList.remove('is-open');
  layout.classList.remove('editor-open');
  formTitle.textContent = '新增/编辑';
  form.innerHTML = '';
}

function dashboardQueryString() {
  const params = new URLSearchParams();
  Object.entries(dashboardFilters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  return params.toString();
}

async function loadDashboard(nextFilters = {}) {
  dashboardFilters = Object.assign({}, dashboardFilters, nextFilters);
  const query = dashboardQueryString();
  dashboardData = await api(`dashboard${query ? `?${query}` : ''}`);
  if (dashboardData && dashboardData.range) {
    dashboardFilters.preset = dashboardData.range.preset || dashboardFilters.preset;
    dashboardFilters.startDate = dashboardData.range.startDate || dashboardFilters.startDate;
    dashboardFilters.endDate = dashboardData.range.endDate || dashboardFilters.endDate;
  }
  return dashboardData;
}

function dashboardLabel(value, fallback = '-') {
  return value === undefined || value === null || value === '' ? fallback : value;
}

function dashboardMetricLabel(metric) {
  const labels = {
    customersTotal: '\u5ba2\u6237\u603b\u6570',
    ayisTotal: '\u963f\u59e8\u603b\u6570',
    demandsTotal: '\u5ba2\u6237\u9700\u6c42\u603b\u6570',
    todayCustomers: '\u4eca\u65e5\u65b0\u589e\u5ba2\u6237',
    todayAyis: '\u4eca\u65e5\u65b0\u589e\u963f\u59e8',
    rangeCustomers: '\u8303\u56f4\u65b0\u589e\u5ba2\u6237',
    rangeAyis: '\u8303\u56f4\u65b0\u589e\u963f\u59e8',
    ayiStatus: '\u963f\u59e8\u72b6\u6001\u6982\u89c8',
    effectiveOperations: '\u6709\u6548\u64cd\u4f5c\u6570'
  };
  return labels[metric] || metric || '-';
}

function dashboardCompareLabel(metric) {
  const labels = {
    newCustomers: '\u65b0\u589e\u5ba2\u6237',
    newAyis: '\u65b0\u589e\u963f\u59e8',
    newDemands: '\u65b0\u589e\u9700\u6c42',
    followUps: '\u8ddf\u8fdb\u8bb0\u5f55',
    appointments: '\u9762\u8bd5\u5b89\u6392',
    effectiveOperations: '\u6709\u6548\u64cd\u4f5c'
  };
  return labels[metric] || metric || '-';
}

function dashboardTrendKey(metric) {
  if (metric === 'ayisTotal' || metric === 'todayAyis' || metric === 'rangeAyis' || metric === 'ayiStatus') return 'newAyis';
  if (metric === 'demandsTotal') return 'newDemands';
  if (metric === 'effectiveOperations') return 'effectiveOperations';
  return 'newCustomers';
}

function renderDashboardDateFilters(data) {
  const presets = [
    ['today', '\u4eca\u65e5'],
    ['yesterday', '\u6628\u65e5'],
    ['last7', '\u8fd1 7 \u5929'],
    ['last30', '\u8fd1 30 \u5929'],
    ['month', '\u672c\u6708'],
    ['lastMonth', '\u4e0a\u6708']
  ];
  const range = data.range || {};
  const activePreset = dashboardFilters.preset || range.preset || 'today';
  return `
    <section class="dashboard-filter-panel">
      <div class="dashboard-filter-head">
        <div>
          <h3>\u7edf\u4e00\u65e5\u671f\u7b5b\u9009</h3>
          <p>\u7edf\u8ba1\u8303\u56f4\uff1a${escapeHtml(range.label || '\u4eca\u65e5')} \u00b7 ${escapeHtml(range.startDate || '-')} \u81f3 ${escapeHtml(range.endDate || '-')}</p>
        </div>
        <button type="button" data-action="dashboard-reset">\u91cd\u7f6e</button>
      </div>
      <div class="dashboard-date-actions">
        ${presets.map(([key, label]) => `
          <button type="button" class="${activePreset === key ? 'is-active' : ''}" data-action="dashboard-date-preset" data-preset="${key}">${label}</button>
        `).join('')}
        <label>\u5f00\u59cb\u65e5\u671f<input type="date" name="dashboardStartDate" value="${escapeHtml(dashboardFilters.startDate || range.startDate || '')}"></label>
        <label>\u7ed3\u675f\u65e5\u671f<input type="date" name="dashboardEndDate" value="${escapeHtml(dashboardFilters.endDate || range.endDate || '')}"></label>
        <button type="button" data-action="dashboard-apply-date">\u81ea\u5b9a\u4e49\u65e5\u671f</button>
      </div>
    </section>
  `;
}

function renderDashboardTrendChart(rows, metric) {
  const trendKey = dashboardTrendKey(metric);
  const values = (rows || []).map((row) => Number(row[trendKey]) || 0);
  const maxValue = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = values.length <= 1 ? 50 : (index / (values.length - 1)) * 100;
    const y = 92 - (value / maxValue) * 78;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
  return `
    <section class="dashboard-card dashboard-chart-card">
      <div class="dashboard-card-head"><h3>\u6307\u6807\u8d8b\u52bf\u5206\u6790</h3><p>${escapeHtml(dashboardMetricLabel(metric))}</p></div>
      ${(rows || []).length ? `
        <svg class="dashboard-line-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img">
          <polyline points="${points}" fill="none" stroke="#1f8a70" stroke-width="3" vector-effect="non-scaling-stroke"></polyline>
        </svg>
        <div class="dashboard-trend-labels">
          ${(rows || []).map((row) => `<span>${escapeHtml(row.date)}<strong>${Number(row[trendKey]) || 0}</strong></span>`).join('')}
        </div>
      ` : '<p class="muted">\u6682\u65e0\u8d8b\u52bf\u6570\u636e</p>'}
    </section>
  `;
}

function renderDashboardDistribution(data) {
  const metric = data.activeMetric || dashboardFilters.metric;
  let title = '\u6307\u6807\u6784\u6210\u5206\u6790';
  let rows = data.distributions && data.distributions.demandStatuses;
  let kind = 'status';
  if (metric === 'ayisTotal' || metric === 'rangeAyis' || metric === 'todayAyis' || metric === 'ayiStatus') {
    rows = data.distributions && data.distributions.ayiStatuses;
    title = '\u963f\u59e8\u72b6\u6001\u5206\u5e03';
  } else if (metric === 'customersTotal' || metric === 'rangeCustomers' || metric === 'todayCustomers') {
    rows = data.distributions && data.distributions.serviceTypes;
    title = '\u670d\u52a1\u7c7b\u578b\u6784\u6210';
    kind = 'serviceType';
  } else if (metric === 'demandsTotal') {
    title = '\u9700\u6c42\u72b6\u6001\u5206\u5e03';
  }
  rows = rows || [];
  const maxValue = Math.max(...rows.map((row) => Number(row.value) || 0), 1);
  return `
    <section class="dashboard-card">
      <div class="dashboard-card-head"><h3>${title}</h3><p>\u70b9\u51fb\u5206\u7c7b\u540e\u660e\u7ec6\u8868\u8054\u52a8\u8fc7\u6ee4</p></div>
      <div class="dashboard-bars">
        ${rows.map((row) => `
          <button type="button" class="dashboard-bar-row" data-action="dashboard-breakdown" data-kind="${kind}" data-value="${escapeHtml(row.name || '')}">
            <span>${escapeHtml(row.name || '\u672a\u586b\u5199')}</span>
            <i style="width:${Math.max(6, (Number(row.value) || 0) / maxValue * 100)}%"></i>
            <strong>${Number(row.value) || 0}</strong>
          </button>
        `).join('') || '<p class="muted">\u6682\u65e0\u6784\u6210\u6570\u636e</p>'}
      </div>
    </section>
  `;
}

function renderDashboardStoreComparison(data) {
  const rows = data.storeComparison || [];
  const maxValue = Math.max(...rows.map((row) => Number(row.value) || 0), 1);
  const metrics = ['newCustomers', 'newAyis', 'newDemands', 'followUps', 'appointments', 'effectiveOperations'];
  return `
    <section class="dashboard-card dashboard-store-card">
      <div class="dashboard-card-head"><h3>\u95e8\u5e97\u8fd0\u8425\u5bf9\u6bd4</h3><p>\u4e0e\u9876\u90e8\u65e5\u671f\u548c\u7edf\u8ba1\u53e3\u5f84\u4fdd\u6301\u4e00\u81f4</p></div>
      <div class="dashboard-compare-actions">
        ${metrics.map((item) => `<button type="button" class="${dashboardFilters.compareMetric === item ? 'is-active' : ''}" data-action="dashboard-compare" data-metric="${item}">${dashboardCompareLabel(item)}</button>`).join('')}
      </div>
      <div class="dashboard-bars">
        ${rows.map((row) => `
          <button type="button" class="dashboard-bar-row" data-action="dashboard-store" data-store="${escapeHtml(row.storeName || '')}">
            <span>${escapeHtml(row.storeName || '\u672a\u5f52\u5c5e')}</span>
            <i style="width:${Math.max(6, (Number(row.value) || 0) / maxValue * 100)}%"></i>
            <strong>${Number(row.value) || 0}</strong>
          </button>
        `).join('') || '<p class="muted">\u5f53\u524d\u6761\u4ef6\u4e0b\u6682\u65e0\u95e8\u5e97\u5bf9\u6bd4\u6570\u636e</p>'}
      </div>
      ${dashboardFilters.storeName ? '<button type="button" class="secondary-action" data-action="dashboard-clear-store">\u67e5\u770b\u5168\u90e8\u95e8\u5e97</button>' : ''}
    </section>
  `;
}

function renderDashboardDetails(data) {
  const details = data.details || { rows: [], total: 0, page: 1, pageSize: 20 };
  const totalPages = Math.max(1, Math.ceil((Number(details.total) || 0) / (Number(details.pageSize) || 20)));
  const isAyiMetric = ['ayiStatus', 'ayisTotal', 'todayAyis', 'rangeAyis'].includes(data.activeMetric);
  const statusRows = (data.distributions && (isAyiMetric ? data.distributions.ayiStatuses : data.distributions.demandStatuses)) || [];
  const serviceRows = (data.distributions && data.distributions.serviceTypes) || [];
  return `
    <section class="dashboard-card dashboard-detail-card">
      <div class="dashboard-card-head"><h3>\u6570\u636e\u660e\u7ec6\u8868</h3><p>\u5f53\u524d\u6307\u6807\uff1a${escapeHtml(dashboardMetricLabel(data.activeMetric || dashboardFilters.metric))}${dashboardFilters.storeName ? ` \u00b7 \u95e8\u5e97\uff1a${escapeHtml(dashboardFilters.storeName)}` : ''}</p></div>
      <div class="dashboard-detail-filters">
        <select name="dashboardStatus"><option value="">\u5168\u90e8\u72b6\u6001</option>${statusRows.map((row) => `<option value="${escapeHtml(row.name || '')}" ${dashboardFilters.status === row.name ? 'selected' : ''}>${escapeHtml(row.name || '\u672a\u586b\u5199')}</option>`).join('')}</select>
        <select name="dashboardServiceType"><option value="">\u5168\u90e8\u670d\u52a1\u7c7b\u578b</option>${serviceRows.map((row) => `<option value="${escapeHtml(row.name || '')}" ${dashboardFilters.serviceType === row.name ? 'selected' : ''}>${escapeHtml(row.name || '\u672a\u586b\u5199')}</option>`).join('')}</select>
        <input type="search" name="dashboardKeyword" value="${escapeHtml(dashboardFilters.keyword || '')}" placeholder="\u641c\u7d22\u5ba2\u6237\u3001\u963f\u59e8\u3001\u624b\u673a\u6216\u64cd\u4f5c\u4eba">
        <button type="button" data-action="dashboard-filter">\u67e5\u8be2</button>
        <button type="button" data-action="dashboard-clear-filters">\u6e05\u7a7a\u7b5b\u9009</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>\u540d\u79f0</th><th>\u8054\u7cfb\u65b9\u5f0f</th><th>\u670d\u52a1/\u6a21\u5757</th><th>\u72b6\u6001</th><th>\u95e8\u5e97</th><th>\u5f55\u5165/\u8d1f\u8d23\u4eba</th><th>\u521b\u5efa\u65e5\u671f</th></tr></thead>
          <tbody>
            ${(details.rows || []).map((row) => `
              <tr>
                <td>${escapeHtml(dashboardLabel(row.name))}</td>
                <td>${escapeHtml(dashboardLabel(row.phone))}</td>
                <td>${escapeHtml(dashboardLabel(row.serviceType))}</td>
                <td>${escapeHtml(dashboardLabel(row.status))}</td>
                <td>${escapeHtml(dashboardLabel(row.storeName, '\u672a\u5f52\u5c5e'))}</td>
                <td>${escapeHtml(dashboardLabel(row.operator))}</td>
                <td>${escapeHtml(formatDateTime(row.createdAt))}</td>
              </tr>
            `).join('') || '<tr><td colspan="7">\u5f53\u524d\u6761\u4ef6\u4e0b\u6682\u65e0\u660e\u7ec6</td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="dashboard-pagination">
        <span>\u5171 ${Number(details.total) || 0} \u6761 \u00b7 \u7b2c ${Number(details.page) || 1}/${totalPages} \u9875</span>
        <button type="button" data-action="dashboard-prev" ${Number(details.page) <= 1 ? 'disabled' : ''}>\u4e0a\u4e00\u9875</button>
        <button type="button" data-action="dashboard-next" ${Number(details.page) >= totalPages ? 'disabled' : ''}>\u4e0b\u4e00\u9875</button>
      </div>
    </section>
  `;
}

function renderDashboard(data) {
  const cards = (data.cards || []).map((card) => `
    <button type="button" class="metric-card ${dashboardFilters.metric === card.key ? 'is-active' : ''}" data-action="dashboard-metric" data-metric="${escapeHtml(card.key || '')}">
      <div class="metric-label">${escapeHtml(card.label)}</div>
      <div class="metric-value">${escapeHtml(card.value)}</div>
      <div class="metric-note">${escapeHtml(card.note || '')}</div>
      <div class="metric-delta">${escapeHtml((card.delta && card.delta.text) || '')}</div>
    </button>
  `).join('');

  list.innerHTML = `
    ${renderDashboardDateFilters(data)}
    <div class="metric-grid">${cards}</div>
    <div class="dashboard-grid">
      ${renderDashboardTrendChart(data.trends || [], data.activeMetric || dashboardFilters.metric)}
      ${renderDashboardDistribution(data)}
      ${renderDashboardStoreComparison(data)}
      ${renderDashboardDetails(data)}
    </div>
  `;
}

function renderDashboardLegacy(data) {
  const cards = (data.cards || []).map((card) => `
    <article class="metric-card">
      <div class="metric-label">${escapeHtml(card.label)}</div>
      <div class="metric-value">${escapeHtml(card.value)}</div>
      <div class="metric-note">${escapeHtml(card.note || '')}</div>
    </article>
  `).join('');
  const tables = (data.tables || []).map((table) => `
    <section class="dashboard-table">
      <h3>${escapeHtml(table.title)}</h3>
      ${(table.rows || []).map((row) => `
        <div class="dashboard-row">
          <span>${escapeHtml(row.name)}</span>
          <strong>${escapeHtml(row.value)}</strong>
        </div>
      `).join('') || '<p class="muted">暂无数据</p>'}
    </section>
  `).join('');

  list.innerHTML = `
    <div class="metric-grid">${cards}</div>
    <div class="dashboard-grid">${tables}</div>
  `;
}

function auditActionLabel(action) {
  const labels = {
    create: '\u65b0\u589e',
    update: '\u4fee\u6539',
    delete: '\u5220\u9664',
    dispatch: '\u6d3e\u5355',
    recommend: '\u63a8\u8350\u963f\u59e8',
    expire: '\u6807\u8bb0\u5931\u6548',
    customer_confirm: '\u5ba2\u6237\u786e\u8ba4',
    customer_reject: '\u5ba2\u6237\u62d2\u7edd',
    login: '\u767b\u5f55',
    logout: '\u9000\u51fa'
  };
  return labels[action] || action || '-';
}

function auditResourceLabel(resource) {
  const labels = {
    accounts: '\u8d26\u53f7\u6743\u9650',
    auth: '\u767b\u5f55\u8ba4\u8bc1',
    ayis: '\u963f\u59e8\u7ba1\u7406',
    banners: '\u9996\u9875\u8f6e\u64ad',
    companyProfile: '\u516c\u53f8\u57fa\u7840\u4fe1\u606f',
    demand_matches: '\u9700\u6c42\u5339\u914d',
    demands: '\u5ba2\u6237\u9700\u6c42',
    order_dispatches: '\u4eba\u5de5\u6d3e\u5355',
    serviceModules: '\u670d\u52a1\u4e2d\u5fc3',
    stores: '\u95e8\u5e97\u4fe1\u606f'
  };
  return labels[resource] || resource || '-';
}

function buildAuditQuery(extra = {}) {
  const params = new URLSearchParams();
  const next = Object.assign({}, auditLogFilters, extra);
  Object.entries(next).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value);
    }
  });
  return params.toString();
}

async function loadAuditLogs(extra = {}) {
  auditLogFilters = Object.assign({}, auditLogFilters, extra);
  const result = await api(`auditLogs?${buildAuditQuery()}`);
  cache = result.items || [];
  auditLogTotal = Number(result.total) || 0;
  auditLogTotalPages = Math.max(1, Number(result.totalPages) || 1);
  auditLogFilters.page = Number(result.page) || auditLogFilters.page || 1;
  auditLogFilters.pageSize = Number(result.pageSize) || auditLogFilters.pageSize || 20;
}

function auditFieldValue(name) {
  const field = list.querySelector(`[name="${name}"]`);
  return field ? field.value.trim() : '';
}

function collectAuditFilters(page = 1) {
  return {
    actor: auditFieldValue('actor'),
    role: auditFieldValue('role'),
    entityType: auditFieldValue('entityType'),
    action: auditFieldValue('action'),
    startTime: auditFieldValue('startTime'),
    endTime: auditFieldValue('endTime'),
    keyword: auditFieldValue('keyword'),
    page,
    pageSize: auditFieldValue('pageSize') || auditLogFilters.pageSize
  };
}

function formatAuditJson(value) {
  if (value === undefined || value === null || value === '') return '\u65e0';
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
}

function renderAuditLogs() {
  const rows = cache;
  const items = rows.map((row) => {
    const resource = row.entityType || row.resourceType;
    const createdAt = row.createdAt ? new Date(row.createdAt).toLocaleString('zh-CN', { hour12: false }) : '-';
    const beforeJson = formatAuditJson(row.beforeData);
    const afterJson = formatAuditJson(row.afterData);
    return `
      <article class="audit-card">
        <div class="audit-main">
          <strong>${escapeHtml(row.actor || 'system')}</strong>
          <span>${escapeHtml(displayRoleName(row.actorRole))}</span>
          <em>${escapeHtml(auditActionLabel(row.action))}</em>
          <span>${escapeHtml(auditResourceLabel(resource))}</span>
          <small>ID: ${escapeHtml(row.resourceId || '-')}</small>
        </div>
        <div class="audit-time">${escapeHtml(createdAt)}</div>
        <div class="audit-summary">
          <span>${escapeHtml(row.beforeSummary || '-')}</span>
          <span>${escapeHtml(row.afterSummary || '-')}</span>
        </div>
        <details class="audit-detail">
          <summary>\u67e5\u770b\u4fee\u6539\u524d\u540e JSON</summary>
          <div>
            <strong>\u4fee\u6539\u524d</strong>
            <pre>${escapeHtml(beforeJson)}</pre>
          </div>
          <div>
            <strong>\u4fee\u6539\u540e</strong>
            <pre>${escapeHtml(afterJson)}</pre>
          </div>
        </details>
      </article>
    `;
  }).join('') || '<p class="muted">\u5f53\u524d\u7b5b\u9009\u6761\u4ef6\u4e0b\u6682\u65e0\u64cd\u4f5c\u8bb0\u5f55\u3002</p>';

  list.innerHTML = `
    <section class="audit-toolbar">
      <label><span>\u64cd\u4f5c\u4eba</span><input name="actor" value="${escapeHtml(auditLogFilters.actor)}" /></label>
      <label><span>\u89d2\u8272</span><select name="role">
        <option value="">\u5168\u90e8</option>
        <option value="boss" ${auditLogFilters.role === 'boss' ? 'selected' : ''}>\u7ba1\u7406\u7aef</option>
        <option value="operator" ${auditLogFilters.role === 'operator' ? 'selected' : ''}>\u8fd0\u8425\u7aef</option>
        <option value="customer" ${auditLogFilters.role === 'customer' ? 'selected' : ''}>\u5ba2\u6237</option>
        <option value="ayi" ${auditLogFilters.role === 'ayi' ? 'selected' : ''}>\u963f\u59e8</option>
      </select></label>
      <label><span>\u6a21\u5757</span><input name="entityType" value="${escapeHtml(auditLogFilters.entityType)}" placeholder="ayis / demands" /></label>
      <label><span>\u64cd\u4f5c\u7c7b\u578b</span><input name="action" value="${escapeHtml(auditLogFilters.action)}" placeholder="create / update" /></label>
      <label><span>\u5f00\u59cb\u65f6\u95f4</span><input name="startTime" type="datetime-local" value="${escapeHtml(auditLogFilters.startTime)}" /></label>
      <label><span>\u7ed3\u675f\u65f6\u95f4</span><input name="endTime" type="datetime-local" value="${escapeHtml(auditLogFilters.endTime)}" /></label>
      <label class="audit-keyword"><span>\u5173\u952e\u5b57</span><input name="keyword" value="${escapeHtml(auditLogFilters.keyword)}" placeholder="\u641c\u7d22\u64cd\u4f5c\u4eba\u3001\u6a21\u5757\u3001\u6458\u8981" /></label>
      <label><span>\u6bcf\u9875</span><select name="pageSize">
        <option value="20" ${Number(auditLogFilters.pageSize) === 20 ? 'selected' : ''}>20</option>
        <option value="50" ${Number(auditLogFilters.pageSize) === 50 ? 'selected' : ''}>50</option>
      </select></label>
      <div class="audit-actions">
        <button type="button" data-action="audit-filter">\u67e5\u8be2</button>
        <button class="secondary" type="button" data-action="audit-reset">\u91cd\u7f6e</button>
        <button class="audit-export" type="button" data-action="audit-export">\u5bfc\u51fa\u64cd\u4f5c\u8bb0\u5f55</button>
      </div>
      <p>\u5171 ${auditLogTotal} \u6761\uff0c\u7b2c ${auditLogFilters.page} / ${auditLogTotalPages} \u9875</p>
    </section>
    <section class="audit-pager">
      <button class="secondary" type="button" data-action="audit-prev" ${auditLogFilters.page <= 1 ? 'disabled' : ''}>\u4e0a\u4e00\u9875</button>
      <span>${auditLogFilters.page} / ${auditLogTotalPages}</span>
      <button class="secondary" type="button" data-action="audit-next" ${auditLogFilters.page >= auditLogTotalPages ? 'disabled' : ''}>\u4e0b\u4e00\u9875</button>
    </section>
    <div class="audit-list">${items}</div>
  `;
}

async function exportAuditLogs() {
  const query = buildAuditQuery(Object.assign({}, auditLogFilters, { page: '', pageSize: '', limit: 10000 }));
  const response = await fetch(`/api/auditLogs/export?${query}`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename\*=UTF-8''([^;]+)/);
  const filename = match ? decodeURIComponent(match[1]) : `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  await loadAuditLogs();
  renderAuditLogs();
}

const exportTypeOptions = [
  ['demands', '客户需求'],
  ['ayis', '阿姨信息'],
  ['appointments', '面试安排'],
  ['appointmentRecords', '预约记录']
];

function exportPresetRange(preset) {
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);
  if (preset === 'today') return { startDate: localDateString(start), endDate: localDateString(end) };
  if (preset === 'last7') {
    start.setDate(today.getDate() - 6);
    return { startDate: localDateString(start), endDate: localDateString(end) };
  }
  if (preset === 'last30') {
    start.setDate(today.getDate() - 29);
    return { startDate: localDateString(start), endDate: localDateString(end) };
  }
  if (preset === 'month') {
    start.setDate(1);
    return { startDate: localDateString(start), endDate: localDateString(end) };
  }
  if (preset === 'lastMonth') {
    start.setMonth(today.getMonth() - 1, 1);
    end.setDate(0);
    return { startDate: localDateString(start), endDate: localDateString(end) };
  }
  return { startDate: '', endDate: '' };
}

function buildExportInfoQuery(filters, extra = {}) {
  const params = new URLSearchParams();
  Object.entries(Object.assign({}, filters, extra)).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  return params.toString();
}

async function loadExportInfo(next = {}) {
  exportInfoFilters = Object.assign({}, exportInfoFilters, next);
  const query = buildExportInfoQuery(exportInfoFilters);
  exportInfoResult = await api(`exportInfo?${query}`);
  return exportInfoResult;
}

function collectExportInfoFilters(page = 1) {
  const type = list.querySelector('[name="exportType"]')?.value || exportInfoFilters.type || 'demands';
  const preset = exportInfoFilters.preset || 'today';
  const startDate = list.querySelector('[name="exportStartDate"]')?.value || '';
  const endDate = list.querySelector('[name="exportEndDate"]')?.value || '';
  return {
    type,
    preset,
    startDate,
    endDate,
    status: list.querySelector('[name="exportStatus"]')?.value || '',
    serviceType: list.querySelector('[name="exportServiceType"]')?.value || '',
    store: list.querySelector('[name="exportStore"]')?.value || '',
    operator: list.querySelector('[name="exportOperator"]')?.value || '',
    interviewMethod: list.querySelector('[name="exportInterviewMethod"]')?.value || '',
    page,
    pageSize: Number(list.querySelector('[name="exportPageSize"]')?.value) || 20
  };
}

function renderExportDynamicFilters(type) {
  const demandStatuses = demandCategories.map((item) => item.label);
  const ayiStatuses = ['已认证', '待审核', '已下架'];
  const appointmentMethods = ['到店面试', '上门面试', '视频面试', '电话沟通', '其他'];
  const serviceTypes = Array.from(new Set(cache.concat(exportInfoResult?.items || []).map((item) => item.serviceType).filter(Boolean)));
  const statusOptions = type === 'ayis'
    ? ayiStatuses
    : type === 'appointments' || type === 'appointmentRecords'
      ? interviewStatuses
      : demandStatuses;
  const methodFilter = type === 'appointments' || type === 'appointmentRecords'
    ? `
      <label>
        <span>面试方式</span>
        <select name="exportInterviewMethod">
          <option value="">全部方式</option>
          ${appointmentMethods.map((item) => `<option value="${escapeHtml(item)}" ${exportInfoFilters.interviewMethod === item ? 'selected' : ''}>${escapeHtml(item)}</option>`).join('')}
        </select>
      </label>
    `
    : '';
  return `
    <label>
      <span>${type === 'ayis' ? '阿姨状态' : type === 'appointments' || type === 'appointmentRecords' ? '面试状态' : '需求状态'}</span>
      <select name="exportStatus">
        <option value="">全部状态</option>
        ${statusOptions.map((item) => `<option value="${escapeHtml(item)}" ${exportInfoFilters.status === item ? 'selected' : ''}>${escapeHtml(item)}</option>`).join('')}
      </select>
    </label>
    <label>
      <span>服务类型</span>
      <select name="exportServiceType">
        <option value="">全部服务</option>
        ${serviceTypes.map((item) => `<option value="${escapeHtml(item)}" ${exportInfoFilters.serviceType === item ? 'selected' : ''}>${escapeHtml(item)}</option>`).join('')}
      </select>
    </label>
    ${methodFilter}
    <label>
      <span>所属门店</span>
      <input name="exportStore" value="${escapeHtml(exportInfoFilters.store || '')}" placeholder="输入门店名称筛选" />
    </label>
    <label>
      <span>${type === 'ayis' ? '录入人员' : '负责人'}</span>
      <input name="exportOperator" value="${escapeHtml(exportInfoFilters.operator || '')}" placeholder="输入姓名筛选" />
    </label>
  `;
}

function renderExportInfo() {
  const result = exportInfoResult || { items: [], total: 0, page: 1, pageSize: 20 };
  const totalPages = Math.max(1, Math.ceil((Number(result.total) || 0) / (Number(result.pageSize) || 20)));
  const typeLabel = exportTypeOptions.find(([key]) => key === exportInfoFilters.type)?.[1] || '客户需求';
  const dateLabel = exportInfoFilters.startDate || exportInfoFilters.endDate
    ? `${exportInfoFilters.startDate || '开始'} 至 ${exportInfoFilters.endDate || '结束'}`
    : '全部';
  const presetButtons = [
    ['today', '今日'],
    ['last7', '近7天'],
    ['last30', '近30天'],
    ['month', '本月'],
    ['lastMonth', '上月'],
    ['all', '全部']
  ].map(([key, label]) => `<button type="button" class="${exportInfoFilters.preset === key ? 'is-active' : ''}" data-action="export-preset" data-preset="${key}">${label}</button>`).join('');
  const rows = (result.items || []).map((item) => {
    const title = item.customerName || item.name || item.ayiName || `记录 ${item.id}`;
    const desc = [
      item.phone,
      item.serviceType,
      item.status,
      item.consultant || item.source || item.interviewMethod,
      item.createdAt ? formatDateTime(item.createdAt) : ''
    ].filter(Boolean).join(' / ');
    return `<article class="record"><div><div class="record-title">${escapeHtml(title)}</div><div class="record-line">${escapeHtml(desc || '-')}</div></div></article>`;
  }).join('') || '<p class="muted">当前条件下没有可导出的数据。</p>';

  list.innerHTML = `
    <section class="export-panel">
      <div class="export-head">
        <h3>导出信息</h3>
        <p>使用中文对象和条件导出当前权限范围内的数据，不输入表名、ID 或技术枚举。</p>
      </div>
      <div class="audit-toolbar export-toolbar">
        <label>
          <span>导出对象</span>
          <select name="exportType">
            ${exportTypeOptions.map(([key, label]) => `<option value="${key}" ${exportInfoFilters.type === key ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </label>
        <label>
          <span>开始日期</span>
          <input type="date" name="exportStartDate" value="${escapeHtml(exportInfoFilters.startDate || '')}" />
        </label>
        <label>
          <span>结束日期</span>
          <input type="date" name="exportEndDate" value="${escapeHtml(exportInfoFilters.endDate || '')}" />
        </label>
        <label>
          <span>每页数量</span>
          <select name="exportPageSize">
            ${[20, 50].map((size) => `<option value="${size}" ${Number(exportInfoFilters.pageSize) === size ? 'selected' : ''}>${size}</option>`).join('')}
          </select>
        </label>
        <div class="export-preset-actions">${presetButtons}<button type="button" data-action="export-reset">重置</button></div>
        ${renderExportDynamicFilters(exportInfoFilters.type)}
        <div class="audit-actions">
          <button type="button" data-action="export-query">查询</button>
          <button type="button" class="audit-export" data-action="export-current">导出当前结果</button>
        </div>
        <p>导出对象：${escapeHtml(typeLabel)}；日期范围：${escapeHtml(dateLabel)}；当前结果：${Number(result.total) || 0} 条。</p>
      </div>
      <div class="audit-pager">
        <button class="secondary" type="button" data-action="export-prev" ${Number(exportInfoFilters.page) <= 1 ? 'disabled' : ''}>上一页</button>
        <span>${Number(exportInfoFilters.page) || 1} / ${totalPages}</span>
        <button class="secondary" type="button" data-action="export-next" ${Number(exportInfoFilters.page) >= totalPages ? 'disabled' : ''}>下一页</button>
      </div>
      <div class="audit-list">${rows}</div>
    </section>
  `;
}

async function exportCurrentInfo() {
  if (!exportInfoFilters.type) {
    alert('请选择导出对象');
    return;
  }
  if (exportInfoFilters.startDate && exportInfoFilters.endDate && exportInfoFilters.startDate > exportInfoFilters.endDate) {
    alert('开始日期不能晚于结束日期');
    return;
  }
  if (exportInfoResult && Number(exportInfoResult.total) === 0) {
    alert('当前条件下没有可导出的数据');
    return;
  }
  const query = buildExportInfoQuery(exportInfoFilters, { page: '', pageSize: '', limit: 10000 });
  const response = await fetch(`/api/exportInfo/export?${query}`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
  });
  if (!response.ok) {
    alert(response.status === 403 ? '您没有该导出权限' : '导出失败，请稍后重试');
    return;
  }
  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename\*=UTF-8''([^;]+)/);
  const filename = match ? decodeURIComponent(match[1]) : `${exportTypeOptions.find(([key]) => key === exportInfoFilters.type)?.[1] || '导出信息'}_${localDateString(new Date())}.csv`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('zh-CN', { hour12: false });
}

function todoCategoryLabels() {
  return [
    ['today', '今日需要跟进'],
    ['overdue', '已逾期'],
    ['unassigned', '暂未分配'],
    ['completedToday', '今日已完成'],
    ['future', '未来待跟进']
  ];
}

function buildTodoQuery(extra = {}) {
  const filters = Object.assign({}, todoFilters, extra);
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  return params.toString();
}

function collectTodoFilters(page = 1) {
  const actor = list.querySelector('[name="todoOperatorId"]');
  const keyword = list.querySelector('[name="todoKeyword"]');
  const pageSize = list.querySelector('[name="todoPageSize"]');
  return {
    operatorId: actor ? actor.value : todoFilters.operatorId,
    keyword: keyword ? keyword.value.trim() : todoFilters.keyword,
    pageSize: pageSize ? Number(pageSize.value) : todoFilters.pageSize,
    page
  };
}

async function loadTodos(extra = {}) {
  todoFilters = Object.assign({}, todoFilters, extra);
  const result = await api(`todos?${buildTodoQuery()}`);
  cache = result.items || [];
  todoStats = result.stats || {};
  todoTotal = Number(result.total) || 0;
  todoTotalPages = Number(result.totalPages) || 1;
  todoFilters.page = Number(result.page) || todoFilters.page;
  todoFilters.pageSize = Number(result.pageSize) || todoFilters.pageSize;
  if (currentUser && currentUser.role === 'boss') {
    try {
      const operatorsResult = await api('demands/assignable-operators');
      assignableOperators = operatorsResult.operators || [];
    } catch (error) {
      assignableOperators = [];
    }
  }
  try {
    const reminderParams = new URLSearchParams({ unread: 'true', pageSize: '8' });
    if (notificationFilters.messageType) reminderParams.set('messageType', notificationFilters.messageType);
    if (notificationFilters.startDate) reminderParams.set('startDate', notificationFilters.startDate);
    if (notificationFilters.endDate) reminderParams.set('endDate', notificationFilters.endDate);
    const reminders = await api(`notifications?${reminderParams.toString()}`);
    backstageNotifications = reminders.items || [];
  } catch (error) {
    backstageNotifications = [];
  }
}

function renderTodos() {
  const reminderRows = backstageNotifications.map((item) => `
    <article class="todo-row notification-reminder">
      <div>
        <div class="record-title">${escapeHtml(item.title || '业务提醒')}</div>
        <div class="record-line">${escapeHtml(item.summary || '')}</div>
        <div class="record-line">${escapeHtml(item.messageType || '-')} / ${escapeHtml(formatDateTime(item.createdAt))}</div>
      </div>
      <div class="record-actions">
        <button data-action="notification-read" data-id="${item.id}">标记已读</button>
      </div>
    </article>
  `).join('') || '<p class="muted">暂无未读业务提醒。</p>';
  const reminderToolbar = `
    <div class="todo-toolbar notification-toolbar">
      <label><span>类型</span><select name="notificationType">
        <option value="" ${!notificationFilters.messageType ? 'selected' : ''}>全部</option>
        <option value="new_" ${notificationFilters.messageType === 'new_' ? 'selected' : ''}>新增业务</option>
        <option value="demand" ${notificationFilters.messageType === 'demand' ? 'selected' : ''}>客户需求</option>
        <option value="interview" ${notificationFilters.messageType === 'interview' ? 'selected' : ''}>面试</option>
        <option value="application" ${notificationFilters.messageType === 'application' ? 'selected' : ''}>接单申请</option>
        <option value="review" ${notificationFilters.messageType === 'review' ? 'selected' : ''}>资料审核</option>
      </select></label>
      <label><span>开始日期</span><input type="date" name="notificationStartDate" value="${escapeHtml(notificationFilters.startDate)}" /></label>
      <label><span>结束日期</span><input type="date" name="notificationEndDate" value="${escapeHtml(notificationFilters.endDate)}" /></label>
      <button data-action="notification-filter">查询提醒</button>
      <button class="secondary" data-action="notification-reset">重置提醒</button>
    </div>
  `;
  const categories = todoCategoryLabels().map(([key, label]) => `
    <button class="todo-category ${todoFilters.category === key ? 'active' : ''}" data-action="todo-category" data-category="${key}">
      <span>${label}</span>
      <strong>${Number(todoStats[key]) || 0}</strong>
    </button>
  `).join('');
  const operatorOptions = currentUser && currentUser.role === 'boss'
    ? `<label><span>负责人</span><select name="todoOperatorId">
        <option value="">全部负责人</option>
        ${assignableOperators.map((item) => `<option value="${item.id}" ${String(todoFilters.operatorId) === String(item.id) ? 'selected' : ''}>${escapeHtml(item.displayName || item.username || item.phone || `账号 ${item.id}`)}</option>`).join('')}
      </select></label>`
    : '';
  const rows = cache.map((item) => `
    <article class="todo-row ${item.isOverdue ? 'is-overdue' : ''}">
      <div>
        <div class="record-title">${escapeHtml(item.customerName || `需求 ${item.id}`)}</div>
        <div class="record-line">${escapeHtml(item.maskedPhone || '-')} / ${escapeHtml(item.serviceType || '-')} / ${escapeHtml(item.status || '-')}</div>
        <div class="record-line">负责人：${escapeHtml(item.assignedOperatorName || '暂未分配')}</div>
        <div class="record-line">最近跟进：${escapeHtml(formatDateTime(item.lastFollowedUpAt))} / 下次跟进：${escapeHtml(formatDateTime(item.nextFollowUpAt))}</div>
      </div>
      <div class="record-actions">
        <button data-action="todo-detail" data-id="${item.id}">进入客户详情</button>
      </div>
    </article>
  `).join('') || '<p class="muted">当前分类暂无待办。</p>';

  list.innerHTML = `
    <section class="todo-shell">
      <section class="todo-reminders">
        <div class="todo-reminder-head">
          <h3>业务提醒</h3>
          <button class="secondary" data-action="notification-read-all">全部已读</button>
        </div>
        ${reminderToolbar}
        ${reminderRows}
      </section>
      <div class="todo-categories">${categories}</div>
      <div class="todo-toolbar">
        <label><span>关键字</span><input name="todoKeyword" value="${escapeHtml(todoFilters.keyword)}" placeholder="客户、电话、地址、服务或状态" /></label>
        ${operatorOptions}
        <label><span>每页</span><select name="todoPageSize">
          <option value="20" ${Number(todoFilters.pageSize) === 20 ? 'selected' : ''}>20</option>
          <option value="50" ${Number(todoFilters.pageSize) === 50 ? 'selected' : ''}>50</option>
        </select></label>
        <button data-action="todo-filter">查询</button>
        <button class="secondary" data-action="todo-reset">重置</button>
      </div>
      <div class="todo-meta">共 ${todoTotal} 条，第 ${todoFilters.page} / ${todoTotalPages} 页</div>
      <div class="todo-list">${rows}</div>
      <div class="audit-pager">
        <button class="secondary" data-action="todo-prev" ${todoFilters.page <= 1 ? 'disabled' : ''}>上一页</button>
        <span>${todoFilters.page} / ${todoTotalPages}</span>
        <button class="secondary" data-action="todo-next" ${todoFilters.page >= todoTotalPages ? 'disabled' : ''}>下一页</button>
      </div>
    </section>
  `;
}

function renderCompanyProfile(profile) {
  const companyFeature = getCompanyServiceFeatureByRoute(currentRoute);
  list.innerHTML = `
    ${companyFeature ? renderCompanyServiceBackLinks(companyFeature.page.route) : ''}
    <article class="record">
      <div>
        <div class="record-title">${escapeHtml(profile.companyName || '未填写公司名称')}</div>
        <div class="record-line">简称：${escapeHtml(profile.shortName || '-')}</div>
        <div class="record-line">默认城市：${escapeHtml(profile.defaultCity || '-')}</div>
        <div class="record-line">公司 Logo：${escapeHtml(profile.companyLogo ? '已配置' : '未配置')}</div>
        <div class="record-line">客服电话：${escapeHtml(profile.customerServicePhone || '未配置')}</div>
        <div class="record-line">地址：${escapeHtml(profile.address || '-')}</div>
        <div class="record-line">营业时间：${escapeHtml(profile.businessHours || '-')}</div>
        <div class="record-line">${escapeHtml(profile.introduction || '')}</div>
      </div>
    </article>
    <p class="muted">公司基础信息为单条配置。管理端可在右侧表单中直接修改并保存，运营端无权访问。</p>
  `;
}

function renderCompanyProfileForm(profile) {
  currentRecord = profile;
  pendingImages = {};
  form.dataset.mode = 'company-profile';
  formTitle.textContent = '编辑公司基础信息';
  form.innerHTML = resources.companyProfile.fields.map(([key, label, type = 'text']) => {
    const value = profile[key] || '';
    if (type === 'textarea') {
      return `<div class="field"><label>${label}</label><textarea name="${key}">${escapeHtml(value)}</textarea></div>`;
    }
    return `<div class="field"><label>${label}</label><input type="${type}" name="${key}" value="${escapeHtml(value)}" /></div>`;
  }).join('') + `
    <div class="form-actions">
      <button type="submit">保存修改</button>
      <button type="button" class="secondary" id="company-profile-reset">取消修改</button>
    </div>
  `;
}

function isEntrancePlanAccount(item) {
  return ['客户入口', '阿姨入口'].includes(item.name);
}

function renderPermissionTags(permissions) {
  const list = Array.isArray(permissions)
    ? permissions
    : String(permissions || '').split(',').map((text) => text.trim()).filter(Boolean);

  return list.length
    ? list.map((item) => `<span class="permission-tag">${escapeHtml(item)}</span>`).join('')
    : '<span class="permission-tag empty">未填写权限</span>';
}

function renderAccountRow(item) {
  const title = item.name || `未命名${item.role || '账号'} #${item.id}`;
  const status = item.status || '启用';
  const roleText = displayRoleName(item.role);

  return `
    <article class="account-row">
      <div>
        <div class="record-title">${escapeHtml(title)}</div>
        <div class="record-line">登录账号：${escapeHtml(item.phone || '未填写')} / ${escapeHtml(roleText)} / ${escapeHtml(item.entry || '-')}</div>
        <div class="permission-list">${renderPermissionTags(item.permissions)}</div>
        ${item.note ? `<div class="record-line">${escapeHtml(item.note)}</div>` : ''}
        <div class="status-badge ${getStatusClass(status)}">${escapeHtml(status)}</div>
      </div>
      <div class="record-actions">
        <button data-action="edit" data-id="${item.id}">编辑</button>
        <button class="delete" data-action="delete" data-id="${item.id}">删除</button>
      </div>
    </article>
  `;
}

function renderMiniprogramUserRow(item) {
  const roleText = item.role === 'ayi' ? '阿姨' : '客户';
  return `
    <article class="account-row login-user-row">
      <div>
        <div class="record-title">${escapeHtml(item.username || `小程序用户 #${item.id}`)}</div>
        <div class="record-line">手机号：${escapeHtml(item.phone || '未绑定')} / ${escapeHtml(roleText)} / 状态：${escapeHtml(item.status || '-')}</div>
        <div class="record-line">
          注册时间：${escapeHtml(formatDateTime(item.registeredAt))}
          ｜最近登录：${escapeHtml(formatDateTime(item.lastLoginAt))}
          ｜方式：${escapeHtml(item.lastLoginMethod || '-')}
        </div>
        <div class="record-line">
          手机验证：${item.phoneVerified ? '已验证' : '未验证'}
          ｜微信绑定：${item.wechatBound ? '已绑定' : '未绑定'}
          ${item.wechatOpenidMasked ? `｜OpenID：${escapeHtml(item.wechatOpenidMasked)}` : ''}
          ｜登录次数：${escapeHtml(item.loginCount || 0)}
        </div>
      </div>
    </article>
  `;
}

function renderAccountsList() {
  const planHtml = accountGroups.map((group) => `
    <article class="account-plan-card">
      <div class="login-role">${escapeHtml(group.role)}</div>
      <div class="record-title">${escapeHtml(group.entry)}</div>
      <div class="record-line">${escapeHtml(group.desc)}</div>
    </article>
  `).join('');

  const realAccounts = cache.filter((item) => !isEntrancePlanAccount(item));
  const groupsHtml = accountGroups.map((group) => {
    const rows = realAccounts.filter((item) => displayRoleName(item.role) === group.role);
    const isExpanded = expandedAccountRole === group.role;
    return `
      <section class="account-group ${isExpanded ? 'is-expanded' : ''}">
        <button class="account-group-toggle" data-action="toggle-account-group" data-role="${escapeHtml(group.role)}">
          <div>
            <h3>${escapeHtml(group.title)}</h3>
            <p>${escapeHtml(group.desc)}</p>
          </div>
          <span>
            <strong>${rows.length} 个</strong>
            <em>${isExpanded ? '收起' : '展开'}</em>
          </span>
        </button>
        ${isExpanded ? (rows.map(renderAccountRow).join('') || '<p class="muted">暂无账号，点击右上角“新增”创建。</p>') : ''}
      </section>
    `;
  }).join('');

  list.innerHTML = `
    <div class="account-note">
      新增账号会按照“账号角色”自动归到下面对应分组。后台登录身份只展示运营端和管理端。
    </div>
    <div class="account-plan-grid">${planHtml}</div>
    <div class="account-groups">${groupsHtml}</div>
    <section class="account-group is-expanded">
      <button class="account-group-toggle" type="button">
        <div>
          <h3>小程序注册与登录信息</h3>
          <p>只读查看注册时间、最近登录、手机号验证和微信绑定状态，不展示 session_key 或完整 OpenID。</p>
        </div>
        <span>${miniprogramUsers.length} 个用户</span>
      </button>
      ${miniprogramUsers.length ? miniprogramUsers.map(renderMiniprogramUserRow).join('') : '<p class="muted">暂无小程序注册用户。</p>'}
    </section>
  `;
}

function renderDemandModuleHome() {
  const demandCount = cache.length;
  list.innerHTML = `
    <section class="category-home">
      <div class="category-home-head">
        <h3>\u5ba2\u6237\u9700\u6c42</h3>
        <p>\u5ba2\u6237\u8d44\u6599\u548c\u9700\u6c42\u8be6\u60c5\u5728\u201c\u9700\u6c42\u5217\u8868\u201d\u7ef4\u62a4\uff1b\u9762\u8bd5\u65f6\u95f4\u3001\u65b9\u5f0f\u3001\u72b6\u6001\u3001\u7ed3\u679c\u548c\u4e0b\u4e00\u6b65\u5b89\u6392\u5728\u201c\u9762\u8bd5\u5b89\u6392\u201d\u7ef4\u62a4\u3002</p>
      </div>
      <div class="category-grid">
        <button class="category-card" data-action="category-route" data-route="demands-list">
          <span class="category-name">\u9700\u6c42\u5217\u8868</span>
          <strong>${demandCount}</strong>
          <small>\u6309\u9700\u6c42\u72b6\u6001\u3001\u65e5\u671f\u548c\u5173\u952e\u8bcd\u67e5\u770b\u5ba2\u6237\u9700\u6c42</small>
          <em>\u8fdb\u5165\u9700\u6c42\u5217\u8868</em>
        </button>
        <button class="category-card" data-action="category-route" data-route="demands-interviews">
          <span class="category-name">\u9762\u8bd5\u5b89\u6392</span>
          <strong>\u8fdb\u5165</strong>
          <small>\u7ba1\u7406\u5173\u8054\u9700\u6c42\u3001\u963f\u59e8\u3001\u9762\u8bd5\u65f6\u95f4\u3001\u72b6\u6001\u3001\u7ed3\u679c\u548c\u4e0b\u4e00\u6b65</small>
          <em>\u8fdb\u5165\u9762\u8bd5\u5b89\u6392</em>
        </button>
      </div>
    </section>
  `;
}
function renderResourceDateToolbar(resource, count) {
  if (!['demands', 'ayis', 'appointments'].includes(resource)) return '';
  const filter = getResourceDateFilter(resource);
  const labels = {
    demands: '\u521b\u5efa\u65e5\u671f',
    ayis: '\u5f55\u5165\u65e5\u671f',
    appointments: '\u9762\u8bd5\u521b\u5efa\u65e5\u671f'
  };
  const presets = [
    ['today', '\u4eca\u65e5'],
    ['last7', '\u8fd17\u5929'],
    ['last30', '\u8fd130\u5929'],
    ['month', '\u672c\u6708'],
    ['all', '\u5168\u90e8']
  ];
  return `
    <div class="date-filter-toolbar">
      <div>
        <strong>${labels[resource] || '\u65e5\u671f\u7b5b\u9009'}</strong>
        <span>${count} \u6761\u8bb0\u5f55</span>
      </div>
      <div class="date-filter-actions">
        ${presets.map(([key, label]) => `<button type="button" class="${filter.preset === key ? 'is-active' : ''}" data-action="resource-date-preset" data-resource="${resource}" data-preset="${key}">${label}</button>`).join('')}
        <label><span>\u5f00\u59cb\u65e5\u671f</span><input type="date" name="resourceStartDate" value="${escapeHtml(filter.startDate || '')}"></label>
        <label><span>\u7ed3\u675f\u65e5\u671f</span><input type="date" name="resourceEndDate" value="${escapeHtml(filter.endDate || '')}"></label>
        <button type="button" data-action="resource-date-custom" data-resource="${resource}">\u81ea\u5b9a\u4e49\u65e5\u671f</button>
        <button type="button" data-action="resource-date-reset" data-resource="${resource}">\u91cd\u7f6e</button>
      </div>
    </div>
  `;
}
function renderAppointmentStatusToolbar() {
  if (currentResource !== 'appointments') return '';
  const dateFiltered = cache
    .filter((item) => recordMatchesDateFilter(item, getResourceDateFilter('appointments')))
    .filter((item) => !appointmentDemandFilter || String(item.demandId || '') === String(appointmentDemandFilter));
  const countFor = (status) => {
    if (status === 'all') return dateFiltered.length;
    if (status === 'unfinished') return dateFiltered.filter((item) => unfinishedInterviewStatuses.includes(item.status || '')).length;
    return dateFiltered.filter((item) => (item.status || '') === status).length;
  };
  const statuses = [['all', '\u5168\u90e8'], ['unfinished', '\u672a\u5b8c\u6210']].concat(interviewStatuses.map((item) => [item, item]));
  return `
    <div class="interview-status-toolbar">
      ${appointmentDemandFilter ? `<button type="button" class="is-active" data-action="clear-appointment-demand-filter"><span>\u9700\u6c42 ${escapeHtml(appointmentDemandFilter)}</span><strong>\u6e05\u9664</strong></button>` : ''}
      ${statuses.map(([key, label]) => `
        <button type="button" class="${appointmentStatusFilter === key ? 'is-active' : ''}" data-action="interview-status-filter" data-status="${escapeHtml(key)}">
          <span>${escapeHtml(label)}</span>
          <strong>${countFor(key)}</strong>
        </button>
      `).join('')}
    </div>
  `;
}
function renderCategoryHome(resource) {
  const meta = resources[resource];
  const categories = getCategoriesForResource(resource) || [];
  const unmatchedDemandCount = resource === 'demands'
    ? cache.filter((item) => !demandCategoryForRecord(item)).length
    : 0;
  const actionText = resource === 'ayis' ? '\u67e5\u770b\u963f\u59e8' : '\u67e5\u770b\u9700\u6c42';
  const subtitle = resource === 'ayis'
    ? '\u8bf7\u9009\u62e9\u9700\u8981\u67e5\u770b\u7684\u963f\u59e8\u5206\u7c7b'
    : '\u8bf7\u9009\u62e9\u9700\u8981\u67e5\u770b\u7684\u9700\u6c42\u72b6\u6001';
  const cards = categories.map((category) => {
    const count = cache.filter((item) => recordMatchesCategory(resource, category, item)).length;
    return `
      <button class="category-card" data-action="category-route" data-route="${escapeHtml(routeWithCategory(resource, category.key))}">
        <span class="category-name">${escapeHtml(category.label)}</span>
        <strong>${count}</strong>
        <small>${escapeHtml(category.hint || '')}</small>
        <em>${actionText}</em>
      </button>
    `;
  }).join('');

  list.innerHTML = `
    <section class="category-home">
      <div class="category-home-head">
        <h3>${escapeHtml(meta.title)}</h3>
        <p>${subtitle}</p>
        ${unmatchedDemandCount ? `<p class="category-warning">\u6709 ${unmatchedDemandCount} \u6761\u9700\u6c42\u72b6\u6001\u672a\u5f52\u7c7b\uff0c\u8bf7\u5728\u7f16\u8f91\u65f6\u8c03\u6574\u4e3a\u6807\u51c6\u72b6\u6001\u3002</p>` : ''}
      </div>
      <div class="category-grid">${cards}</div>
    </section>
  `;
}

function renderList() {
  if (currentResource === 'accounts') {
    renderAccountsList();
    return;
  }

  const meta = resources[currentResource];
  const baseRecords = getFilteredCache();
  const canSearch = currentModuleCategory && isSearchableCategoryResource(currentResource);
  const searchQuery = canSearch ? currentModuleSearchQuery.trim().toLowerCase() : '';
  const records = searchQuery
    ? baseRecords.filter((item) => recordMatchesSearch(currentResource, item, searchQuery))
    : baseRecords;
  const searchPlaceholder = currentResource === 'ayis'
    ? '\u8f93\u5165\u59d3\u540d\u3001\u7535\u8bdd\u3001\u670d\u52a1\u7c7b\u578b\u6216\u72b6\u6001'
    : currentResource === 'appointments'
      ? '输入客户、阿姨、电话、面试方式、状态或备注'
      : '\u8f93\u5165\u5ba2\u6237\u3001\u7535\u8bdd\u3001\u5730\u5740\u3001\u670d\u52a1\u7c7b\u578b\u6216\u72b6\u6001';
  const dateToolbar = renderResourceDateToolbar(currentResource, records.length);
  const interviewToolbar = renderAppointmentStatusToolbar();
  const demandSubHeader = currentResource === 'demands' && currentRoute === 'demands-list' ? `
    <div class="category-list-header">
      <button class="secondary" data-action="route-card" data-route="demands">\u8fd4\u56de\u5ba2\u6237\u9700\u6c42</button>
      <button class="secondary" data-action="route-card" data-route="demands-interviews">\u9762\u8bd5\u5b89\u6392</button>
      <div><strong>\u9700\u6c42\u5217\u8868</strong><span>\u5ba2\u6237\u57fa\u672c\u8d44\u6599\u548c\u9700\u6c42\u4e3b\u8bb0\u5f55\u5728\u6b64\u7ef4\u62a4</span></div>
    </div>
  ` : '';
  const interviewSubHeader = currentResource === 'appointments' && currentRoute === 'demands-interviews' ? `
    <div class="category-list-header">
      <button class="secondary" data-action="route-card" data-route="demands">\u8fd4\u56de\u5ba2\u6237\u9700\u6c42</button>
      <button class="secondary" data-action="route-card" data-route="demands-list">\u9700\u6c42\u5217\u8868</button>
      ${appointmentDemandFilter ? `<button class="secondary" data-action="clear-appointment-demand-filter">\u67e5\u770b\u5168\u90e8\u9762\u8bd5</button>` : ''}
      <div><strong>\u9762\u8bd5\u5b89\u6392</strong><span>\u53ea\u7ef4\u62a4\u9762\u8bd5\u4fe1\u606f\uff0c\u5ba2\u6237\u9700\u6c42\u6458\u8981\u53ea\u8bfb\u5c55\u793a</span></div>
    </div>
  ` : '';
  const categoryHeader = currentModuleCategory ? `
    <div class="category-list-header">
      <button class="secondary" data-action="category-back">\u8fd4\u56de\u5206\u7c7b</button>
      <div>
        <strong>${escapeHtml(currentModuleCategory.label)}</strong>
        <span>${searchQuery ? `${records.length} / ${baseRecords.length}` : baseRecords.length} \u6761\u8bb0\u5f55</span>
      </div>
    </div>
    ${canSearch ? `
      <label class="category-search">
        <span>\u4fe1\u606f\u68c0\u7d22</span>
        <input
          type="search"
          data-action="category-search"
          value="${escapeHtml(currentModuleSearchQuery)}"
          placeholder="${searchPlaceholder}"
          autocomplete="off"
        />
      </label>
    ` : ''}
  ` : '';
  const serviceSection = currentResource === 'serviceModules' ? getServiceModuleSectionByRoute(currentRoute) : null;
  const serviceHeader = serviceSection ? `
    <div class="category-list-header">
      <button class="secondary" data-action="route-card" data-route="${escapeHtml(serviceSection.pageRoute || 'company-services')}">返回上一级</button>
      <button class="secondary" data-action="route-card" data-route="company-services">返回公司服务</button>
      <div>
        <strong>${escapeHtml(serviceSection.title)}</strong>
        <span>${records.length} 条记录</span>
      </div>
    </div>
  ` : '';
  const companyFeature = getCompanyServiceFeatureByRoute(currentRoute);
  const companyFeatureHeader = companyFeature && !serviceSection ? `
    <div class="category-list-header">
      <button class="secondary" data-action="route-card" data-route="${escapeHtml(companyFeature.page.route)}">返回上一级</button>
      <button class="secondary" data-action="route-card" data-route="company-services">返回公司服务</button>
      <div>
        <strong>${escapeHtml(companyFeature.title)}</strong>
        <span>数据来源：${escapeHtml(companyFeature.source || currentResource)}</span>
      </div>
    </div>
  ` : '';

  const rows = records.map((item) => {
    const title = item.name || item.customerName || item.title || `记录 ${item.id}`;
    const lines = meta.summary(item).map((line) => `<div class="record-line">${escapeHtml(line)}</div>`).join('');
    const status = item.status || (Object.prototype.hasOwnProperty.call(item, 'visible') ? (item.visible ? '显示中' : '已隐藏') : '');
    const badge = status ? `<div class="status-badge ${getStatusClass(item.status ?? item.visible)}">${escapeHtml(status)}</div>` : '';
    const needsThumb = ['ayis', 'serviceModules'].includes(currentResource);
    const image = item.image
      ? `<img class="record-thumb" src="${escapeHtml(item.image)}" alt="${escapeHtml(title)}" />`
      : needsThumb
        ? '<div class="record-thumb placeholder">无图</div>'
        : '';
    const isEditing = currentRecord && currentRecord.id === item.id;
    const editLabel = currentResource === 'ayis' ? '编辑资料' : '编辑';
    const demandDetailButton = currentResource === 'demands'
      ? `<button data-action="demand-detail" data-id="${item.id}">详情/跟进</button>`
      : '';
    const demandInterviewsButton = currentResource === 'demands'
      ? `<button data-action="view-demand-appointments" data-id="${item.id}">查看面试安排</button><button data-action="new-demand-appointment" data-id="${item.id}">新增面试</button>`
      : '';
    const demandMatchButton = currentResource === 'demands'
      ? `<button data-action="match-demand" data-id="${item.id}">推荐阿姨</button>`
      : '';
    const appointmentDemandButton = currentResource === 'appointments' && item.demandId
      ? `<button data-action="open-linked-demand" data-id="${item.demandId}">查看关联需求</button>`
      : '';
    const appointmentStatusButton = currentResource === 'appointments'
      ? `<button data-action="change-appointment-status" data-id="${item.id}">修改状态</button>`
      : '';
    const ayiAvailabilityButton = currentResource === 'ayis'
      ? `<button data-action="ayi-availability" data-id="${item.id}">档期/偏好</button>`
      : '';
    const availabilityLines = currentResource === 'ayis'
      ? `
        <div class="record-line">服务状态：${escapeHtml(displayAyiServiceStatus(item.serviceStatus || 'available'))} / ${item.recommendable ? '可推荐' : '不可推荐'}</div>
        <div class="record-line">最早上岗：${escapeHtml(formatDateOnly(item.availableFrom) || '-')} / 档期确认：${escapeHtml(formatDateTime(item.statusConfirmedAt) || '-')} ${item.scheduleNeedsConfirmation ? '<span class="status-badge warn">档期待确认</span>' : ''}</div>
        <div class="record-line">服务区域：${escapeHtml(Array.isArray(item.preferenceRegions) && item.preferenceRegions.length ? item.preferenceRegions.join('、') : '-')}</div>
        <div class="record-line">服务类型：${escapeHtml(Array.isArray(item.preferenceServices) && item.preferenceServices.length ? item.preferenceServices.join('、') : (item.serviceType || '-'))}</div>
        <div class="record-line">期望薪资：${escapeHtml(formatSalaryRange(item.minSalary, item.maxSalary))}</div>
      `
      : '';
    return `
      <article class="record ${needsThumb ? 'has-thumb' : ''} ${isEditing ? 'is-editing' : ''}">
        ${image}
        <div>
          <div class="record-title">${escapeHtml(title)}</div>
          ${lines}
          ${['demands', 'ayis', 'appointments'].includes(currentResource) ? `<div class="record-line">${currentResource === 'ayis' ? '录入日期' : '创建日期'}：${escapeHtml(formatDateTime(item.createdAt))}</div>` : ''}
          ${currentResource === 'demands' ? `<div class="record-line">最近更新：${escapeHtml(formatDateTime(item.updatedAt))} / 最近跟进：${escapeHtml(formatDateTime(item.lastFollowedUpAt))} / 下次跟进：${escapeHtml(formatDateTime(item.nextFollowUpAt))}</div>` : ''}
          ${currentResource === 'appointments' ? `<div class="record-line">需求摘要：${escapeHtml(item.customerName || '-')} / ${escapeHtml(item.phone || '-')} / ${escapeHtml(item.serviceType || '-')}</div><div class="record-line">面试：${escapeHtml(item.date || '-')} / ${escapeHtml(item.interviewMethod || '-')} / ${escapeHtml(item.address || '-')}</div><div class="record-line">结果：${escapeHtml(item.interviewResult || '-')} / 下一步：${escapeHtml(item.nextStep || '-')}</div>` : ''}
          ${availabilityLines}
          ${badge}
        </div>
        <div class="record-actions">
          ${demandDetailButton}
          ${demandInterviewsButton}
          ${demandMatchButton}
          ${appointmentDemandButton}
          ${appointmentStatusButton}
          ${ayiAvailabilityButton}
          <button data-action="edit" data-id="${item.id}">${editLabel}</button>
          <button class="delete" data-action="delete" data-id="${item.id}">删除</button>
        </div>
      </article>
    `;
  }).join('') || `<p class="muted">${searchQuery ? '当前检索条件下暂无数据。' : (currentModuleCategory ? '当前分类暂无数据。' : '暂无数据，点击新增开始录入。')}</p>`;

  list.innerHTML = companyFeatureHeader + serviceHeader + demandSubHeader + interviewSubHeader + dateToolbar + interviewToolbar + categoryHeader + rows;
}

function openDemandAppointmentEditor(demand) {
  currentResource = 'appointments';
  currentRoute = 'demands-interviews';
  currentRecord = null;
  form.dataset.mode = '';
  renderForm({
    demandId: demand.id,
    customerName: demand.customerName || demand.name || '',
    phone: demand.phone || '',
    serviceType: demand.serviceType || '',
    address: demand.address || '',
    consultant: demand.consultant || demand.assignedOperatorName || '',
    status: '待安排'
  });
  currentRecord = null;
  formTitle.textContent = `新增面试：${demand.customerName || demand.name || `需求 ${demand.id}`}`;
  editor.classList.add('is-open');
  layout.classList.add('editor-open');
  editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openAppointmentStatusPanel(record) {
  currentRecord = record;
  form.dataset.mode = 'appointment-status';
  form.dataset.appointmentId = record.id;
  formTitle.textContent = `修改面试状态：${record.customerName || record.ayiName || `记录 ${record.id}`}`;
  form.innerHTML = `
    <div class="edit-state">
      <strong>当前状态：</strong>${escapeHtml(record.status || '-')}
      <div class="record-line">关联需求：${escapeHtml(record.customerName || '-')} / ${escapeHtml(record.serviceType || '-')}</div>
    </div>
    <div class="field">
      <label>面试状态</label>
      <select name="appointmentStatus">
        ${interviewStatuses.map((status) => `<option value="${escapeHtml(status)}" ${record.status === status ? 'selected' : ''}>${escapeHtml(status)}</option>`).join('')}
      </select>
    </div>
    <div class="form-actions">
      <button type="button" data-action="save-appointment-status">保存状态</button>
      <button type="button" class="secondary" id="clearBtn">取消</button>
    </div>
  `;
  editor.classList.add('is-open');
  layout.classList.add('editor-open');
  editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function isCertifiedAyi(item) {
  return ['已认证', 'approved'].includes(item.status) && item.visible !== false;
}

function displayAyiServiceStatus(status) {
  return {
    available: '可接单',
    working: '服务中',
    leave: '请假中',
    resting: '暂停接单',
    unreachable: '暂时无法联系'
  }[status] || '未知状态';
}

function formatDateOnly(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function formatSalaryRange(minSalary, maxSalary) {
  const min = minSalary === null || minSalary === undefined || minSalary === '' ? '' : String(minSalary);
  const max = maxSalary === null || maxSalary === undefined || maxSalary === '' ? '' : String(maxSalary);
  if (min && max) return `${min}-${max}`;
  if (min) return `${min}起`;
  if (max) return `${max}以内`;
  return '-';
}

async function openDemandMatchPanel(record) {
  currentRecord = record;
  form.dataset.mode = 'demand-match';
  form.dataset.demandId = record.id;
  editor.classList.add('is-open');
  layout.classList.add('editor-open');
  formTitle.textContent = `推荐阿姨：${record.customerName || record.name || `需求 ${record.id}`}`;

  const [matchResult, ayis] = await Promise.all([
    api(`demands/${record.id}/matches`),
    api('ayis')
  ]);
  const certifiedAyis = (ayis || []).filter(isCertifiedAyi);
  const options = certifiedAyis.map((ayi) => (
    `<option value="${ayi.id}">${escapeHtml(ayi.name || `阿姨 ${ayi.id}`)} / ${escapeHtml(ayi.serviceType || '-')} / ${escapeHtml(ayi.phone || '-')}</option>`
  )).join('');
  const matchRows = (matchResult.matches || []).map((match) => `
    <div class="match-row">
      <div>
        <strong>${escapeHtml(match.ayiName || `阿姨 ${match.ayiId}`)}</strong>
        <span>${escapeHtml(match.serviceType || '-')}</span>
        <span class="status-badge ${getStatusClass(match.status)}">${escapeHtml(match.status)}</span>
        ${match.recommendNote ? `<div class="record-line">${escapeHtml(match.recommendNote)}</div>` : ''}
      </div>
      ${match.status === '已推荐' ? `<button type="button" class="secondary" data-action="expire-match" data-id="${match.id}">标记失效</button>` : ''}
    </div>
  `).join('') || '<p class="muted">暂未推荐阿姨。</p>';

  form.innerHTML = `
    <section class="match-panel">
      <div class="record-title">${escapeHtml(record.customerName || '-')} / ${escapeHtml(record.serviceType || '-')}</div>
      <div class="record-line">电话：${escapeHtml(record.phone || '-')}</div>
      <div class="record-line">地址：${escapeHtml(`${record.city || ''} ${record.address || ''}`.trim() || '-')}</div>
      <div class="record-line">预算：${escapeHtml(record.budget || '-')} / 上户：${escapeHtml(record.startTime || '-')}</div>
      <div class="record-line">状态：${escapeHtml(record.status || '-')}</div>
      <h3>已推荐阿姨</h3>
      <div class="match-list">${matchRows}</div>
      <h3>新增推荐</h3>
      <div class="field">
        <label>选择已认证阿姨</label>
        <select name="ayiId">${options}</select>
      </div>
      <div class="field">
        <label>推荐说明</label>
        <textarea name="recommendNote" placeholder="说明推荐原因、匹配点和注意事项"></textarea>
      </div>
      <div class="form-actions">
        <button type="submit" ${options ? '' : 'disabled'}>保存推荐</button>
        <button type="button" class="secondary" id="clearBtn">关闭</button>
      </div>
    </section>
  `;
}

async function openDemandDetailPanel(record) {
  currentRecord = record;
  form.dataset.mode = 'demand-detail';
  form.dataset.demandId = record.id;
  editor.classList.add('is-open');
  layout.classList.add('editor-open');
  formTitle.textContent = `客户详情：${record.customerName || `需求 ${record.id}`}`;

  const [followResult, operatorsResult] = await Promise.all([
    api(`demands/${record.id}/follow-ups`),
    currentUser && currentUser.role === 'boss'
      ? api('demands/assignable-operators')
      : Promise.resolve({ operators: [] })
  ]);
  const demand = followResult.demand || record;
  const followUps = followResult.items || [];
  const operators = operatorsResult.operators || [];
  const assignmentForm = currentUser && currentUser.role === 'boss'
    ? `
      <section class="detail-block">
        <h3>负责人</h3>
        <div class="field">
          <label>当前负责人</label>
          <select name="assignedOperatorId">
            <option value="">暂不分配</option>
            ${operators.map((item) => `<option value="${item.id}" ${String(demand.assignedOperatorId || '') === String(item.id) ? 'selected' : ''}>${escapeHtml(item.displayName || item.username || item.phone || `账号 ${item.id}`)}</option>`).join('')}
          </select>
        </div>
        <button type="button" data-action="save-assignment">保存负责人</button>
      </section>
    `
    : `
      <section class="detail-block">
        <h3>负责人</h3>
        <p class="muted">${escapeHtml(demand.assignedOperatorName || '暂未分配')}</p>
      </section>
    `;
  const timeline = followUps.map((item) => `
    <article class="followup-item">
      <strong>${escapeHtml(formatDateTime(item.contactedAt))}</strong>
      <span>${escapeHtml(item.operatorName || '-')} / ${escapeHtml(displayFollowUpMethod(item.method))}</span>
      ${item.result ? `<div>结果：${escapeHtml(item.result)}</div>` : ''}
      ${item.note ? `<p>${escapeHtml(item.note)}</p>` : ''}
      <small>下次跟进：${escapeHtml(formatDateTime(item.nextFollowUpAt))}</small>
    </article>
  `).join('') || '<p class="muted">暂无跟进记录。</p>';

  form.innerHTML = `
    <section class="detail-block">
      <div class="record-title">${escapeHtml(demand.customerName || '-')}</div>
      <div class="record-line">电话：${escapeHtml(demand.maskedPhone || demand.phone || '-')}</div>
      <div class="record-line">需求：${escapeHtml(demand.serviceType || '-')} / ${escapeHtml(demand.status || '-')}</div>
      <div class="record-line">地址：${escapeHtml(`${demand.city || ''} ${demand.address || ''}`.trim() || '-')}</div>
      <div class="record-line">最近跟进：${escapeHtml(formatDateTime(demand.lastFollowedUpAt))}</div>
      <div class="record-line">下次跟进：${escapeHtml(formatDateTime(demand.nextFollowUpAt))}</div>
    </section>
    ${assignmentForm}
    <section class="detail-block">
      <h3>新增跟进</h3>
      <div class="field">
        <label>跟进方式</label>
        <select name="followMethod">
          <option value="phone">电话</option>
          <option value="wechat">微信</option>
          <option value="visit">到访</option>
          <option value="other">其他</option>
        </select>
      </div>
      <div class="field"><label>跟进结果</label><input name="followResult" maxlength="200" /></div>
      <div class="field"><label>跟进时间</label><input name="contactedAt" type="datetime-local" /></div>
      <div class="field"><label>下次跟进时间</label><input name="nextFollowUpAt" type="datetime-local" /></div>
      <div class="field"><label>备注</label><textarea name="followNote" maxlength="2000"></textarea></div>
      <button type="button" data-action="save-follow-up">保存跟进</button>
    </section>
    <section class="detail-block">
      <h3>跟进历史</h3>
      <div class="followup-timeline">${timeline}</div>
    </section>
    <div class="form-actions">
      <button type="button" class="secondary" id="clearBtn">关闭</button>
    </div>
  `;
}

async function openAyiAvailabilityPanel(record) {
  currentRecord = record;
  form.dataset.mode = 'ayi-availability';
  form.dataset.ayiId = record.id;
  editor.classList.add('is-open');
  layout.classList.add('editor-open');
  formTitle.textContent = `阿姨档期/偏好：${record.name || `阿姨 ${record.id}`}`;

  const [profileResult, serviceModulesResult, historyResult] = await Promise.all([
    api(`ayis/${record.id}/availability`),
    api('serviceModules'),
    api(`ayis/${record.id}/status-history`)
  ]);
  const profile = profileResult.profile || {};
  const availability = profile.availability || {};
  const preferences = profile.preferences || {};
  const selectedServiceIds = new Set((profile.serviceTypes || []).map((item) => Number(item.id)));
  const services = (serviceModulesResult || []).filter((item) => item.moduleType === 'service' && item.visible !== false);
  const serviceOptions = services.map((item) => `
    <label class="check-line">
      <input type="checkbox" name="serviceTypeIds" value="${item.id}" ${selectedServiceIds.has(Number(item.id)) ? 'checked' : ''} />
      <span>${escapeHtml(item.title || `服务 ${item.id}`)}</span>
    </label>
  `).join('') || '<p class="muted">暂无后台服务项目。</p>';
  const weekdaySet = new Set((availability.serviceWeekdays || []).map((item) => Number(item)));
  const slotSet = new Set(availability.serviceTimeSlots || []);
  const historyRows = (historyResult.history || []).map((item) => `
    <div class="followup-item">
      <strong>${escapeHtml(formatDateTime(item.createdAt) || '-')} / ${escapeHtml(item.changeType || '-')}</strong>
      <div class="record-line">操作人：${escapeHtml(item.changedByName || item.changedBy || '-')}</div>
      <pre>${escapeHtml(JSON.stringify(item.afterData || {}, null, 2))}</pre>
    </div>
  `).join('') || '<p class="muted">暂无状态修改历史。</p>';

  form.innerHTML = `
    <section class="detail-block">
      <h3>服务状态与档期</h3>
      <div class="field">
        <label>当前服务状态</label>
        <select name="serviceStatus">
          ${['available', 'working', 'leave', 'resting', 'unreachable'].map((status) => (
            `<option value="${status}" ${availability.serviceStatus === status ? 'selected' : ''}>${displayAyiServiceStatus(status)}</option>`
          )).join('')}
        </select>
      </div>
      <div class="field-grid">
        <div class="field"><label>最早可上岗日期</label><input type="date" name="availableFrom" value="${escapeHtml(formatDateOnly(availability.availableFrom))}" /></div>
        <div class="field"><label>可服务结束日期</label><input type="date" name="availableTo" value="${escapeHtml(formatDateOnly(availability.availableTo))}" /></div>
      </div>
      <div class="field"><label><input type="checkbox" name="longTermAvailable" value="true" ${availability.longTermAvailable !== false ? 'checked' : ''} /> 长期可服务</label></div>
      <div class="field">
        <label>可服务星期</label>
        <div class="inline-checks">
          ${[1, 2, 3, 4, 5, 6, 7].map((day) => `<label><input type="checkbox" name="serviceWeekdays" value="${day}" ${weekdaySet.has(day) ? 'checked' : ''} /> 周${day === 7 ? '日' : day}</label>`).join('')}
        </div>
      </div>
      <div class="field">
        <label>可服务时间段</label>
        <div class="inline-checks">
          ${[
            ['day', '白班'],
            ['night', '夜班'],
            ['live_in', '住家'],
            ['temporary', '临时'],
            ['long_term', '长期']
          ].map(([value, label]) => `<label><input type="checkbox" name="serviceTimeSlots" value="${value}" ${slotSet.has(value) ? 'checked' : ''} /> ${label}</label>`).join('')}
        </div>
      </div>
      <div class="field"><label>档期备注</label><textarea name="scheduleNote">${escapeHtml(availability.scheduleNote || '')}</textarea></div>
    </section>

    <section class="detail-block">
      <h3>服务范围与接单偏好</h3>
      <div class="field"><label>可服务区域，逐项用逗号分隔</label><input name="regions" value="${escapeHtml((profile.regions || []).join(', '))}" /></div>
      <div class="field"><label>可接受服务类型</label><div class="check-grid">${serviceOptions}</div></div>
      <div class="inline-checks">
        <label><input type="checkbox" name="acceptLiveIn" value="true" ${preferences.acceptLiveIn ? 'checked' : ''} /> 接受住家</label>
        <label><input type="checkbox" name="acceptDayShift" value="true" ${preferences.acceptDayShift !== false ? 'checked' : ''} /> 接受白班</label>
        <label><input type="checkbox" name="acceptNightShift" value="true" ${preferences.acceptNightShift ? 'checked' : ''} /> 接受夜班</label>
        <label><input type="checkbox" name="acceptLongTerm" value="true" ${preferences.acceptLongTerm !== false ? 'checked' : ''} /> 接受长期订单</label>
        <label><input type="checkbox" name="acceptTemporary" value="true" ${preferences.acceptTemporary !== false ? 'checked' : ''} /> 接受临时订单</label>
      </div>
      <div class="field-grid">
        <div class="field"><label>期望最低薪资</label><input type="number" min="0" name="minSalary" value="${escapeHtml(preferences.minSalary ?? '')}" /></div>
        <div class="field"><label>期望最高薪资</label><input type="number" min="0" name="maxSalary" value="${escapeHtml(preferences.maxSalary ?? '')}" /></div>
      </div>
      <div class="field"><label>最快到岗日期</label><input type="date" name="earliestStartDate" value="${escapeHtml(formatDateOnly(preferences.earliestStartDate))}" /></div>
      <div class="field"><label>补充说明</label><textarea name="note">${escapeHtml(preferences.note || '')}</textarea></div>
    </section>

    <div class="form-actions">
      <button type="submit">保存档期和偏好</button>
      <button type="button" class="secondary" id="clearBtn">取消</button>
    </div>

    <section class="detail-block">
      <h3>状态修改历史</h3>
      <div class="followup-timeline">${historyRows}</div>
    </section>
  `;
}

function displayFollowUpMethod(method) {
  const map = {
    phone: '电话',
    wechat: '微信',
    visit: '到访',
    other: '其他'
  };
  return map[method] || method || '-';
}

async function refreshCurrentDemandViews(demandId) {
  if (currentRoute === 'todos') {
    await loadTodos();
    renderTodos();
    const latest = cache.find((item) => Number(item.id) === Number(demandId)) || currentRecord;
    await openDemandDetailPanel(latest);
    return;
  }
  if (currentResource === 'demands') {
    await loadResource('demands');
    const latest = cache.find((item) => Number(item.id) === Number(demandId)) || currentRecord;
    await openDemandDetailPanel(latest);
  }
}

function renderForm(record = null) {
  currentRecord = record;
  pendingImages = {};
  const meta = resources[currentResource];
  const serviceSection = currentResource === 'serviceModules' ? getServiceModuleSectionByRoute(currentRoute) : null;
  const recordName = record ? (record.name || record.customerName || record.title || `记录 ${record.id}`) : '';
  const title = serviceSection ? serviceSection.title : meta.title;
  formTitle.textContent = record ? `编辑${title}：${recordName}` : `新增${title}`;
  const fields = getCurrentFields().map(([key, label, type = 'text', options = []]) => {
    const raw = record ? (key === 'role' ? displayRoleName(record[key]) : record[key]) : '';
    const value = Array.isArray(raw) ? raw.join(', ') : raw || '';
    if (type === 'textarea') {
      return `<div class="field"><label>${label}</label><textarea name="${key}">${escapeHtml(value)}</textarea></div>`;
    }
    if (type === 'select') {
      const optionHtml = options.map((option) => (
        `<option value="${escapeHtml(option)}" ${String(value) === String(option) ? 'selected' : ''}>${escapeHtml(displaySelectOption(key, option))}</option>`
      )).join('');
      return `<div class="field"><label>${label}</label><select name="${key}">${optionHtml}</select></div>`;
    }
    if (type === 'boolean') {
      return `
        <div class="field">
          <label>${label}</label>
          <select name="${key}">
            <option value="true" ${value === true || value === 'true' || value === '' ? 'selected' : ''}>是</option>
            <option value="false" ${value === false || value === 'false' ? 'selected' : ''}>否</option>
          </select>
        </div>
      `;
    }
    if (type === 'visibility') {
      return `
        <div class="field">
          <label>${label}</label>
          <select name="${key}">
            <option value="true" ${value === true || value === 'true' || value === '' ? 'selected' : ''}>上架</option>
            <option value="false" ${value === false || value === 'false' ? 'selected' : ''}>下架</option>
          </select>
        </div>
      `;
    }
    if (type === 'image') {
      const preview = value ? `<img class="image-preview" src="${escapeHtml(value)}" alt="图片预览" />` : '<div class="image-empty">暂未上传图片</div>';
      return `
        <div class="field image-field">
          <label>${label}</label>
          <div class="image-preview-wrap" data-preview="${key}">${preview}</div>
          <input type="hidden" name="${key}" value="${escapeHtml(value)}" />
          <input type="file" accept="image/*" data-image-field="${key}" />
          <div class="field-help">${imageTips[key] || imageTips.default}</div>
        </div>
      `;
    }
    return `<div class="field"><label>${label}</label><input type="${type}" name="${key}" value="${escapeHtml(value)}" /></div>`;
  }).join('');

  form.innerHTML = `
    ${record ? `<div class="edit-state">正在编辑：${escapeHtml(recordName)}。修改后点下面的“保存修改”。</div>` : ''}
    ${fields}
    <div class="form-actions">
      <button type="submit">${record ? '保存修改' : '保存新增'}</button>
      <button type="button" class="secondary" id="clearBtn">关闭</button>
    </div>
  `;
}

document.querySelector('.tabs').addEventListener('click', (event) => {
  const tab = event.target.closest('.tab');
  if (tab) setRoute(tab.dataset.route || 'home');
});

document.querySelector('#refreshBtn').addEventListener('click', () => renderRoute());
document.querySelector('#addBtn').addEventListener('click', () => openEditor());
backHomeBtn.addEventListener('click', () => setRoute('home'));
document.querySelector('#logoutBtn').addEventListener('click', async () => {
  try {
    await api('auth/logout', { method: 'POST' });
  } catch (error) {
    // Local logout should still clear the browser state if the session already expired.
  }
  clearAuth('已退出，请重新登录。');
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  loginTip.textContent = '';
  try {
    const result = await api('auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: formData.get('identifier'),
        password: formData.get('password')
      })
    });
    authToken = result.token;
    currentUser = result.user;
    localStorage.setItem('ygby_auth_token', authToken);
    const me = await api('auth/me');
    currentUser = me.user;
    allowedResources = me.allowedResources || [];
    if (!me.canUseBackstage) {
      clearAuth('该账号不能进入后台，请使用运营端或管理端账号。');
      return;
    }
    loginForm.reset();
    applyAuthShell();
    setRoute('home');
  } catch (error) {
    loginTip.textContent = '登录失败，请检查账号、密码或账号状态。';
  }
});

list.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.action === 'route-card') {
    setRoute(button.dataset.route || 'home');
    return;
  }
  if (button.dataset.action === 'category-route') {
    setRoute(button.dataset.route || currentRoute || 'home');
    return;
  }
  if (button.dataset.action === 'category-back') {
    setRoute(currentRoute || 'home');
    return;
  }
  if (button.dataset.action === 'resource-date-preset') {
    const resource = button.dataset.resource || currentResource;
    const preset = button.dataset.preset || 'all';
    const range = getDateRangeByPreset(preset);
    resourceDateFilters[resource] = Object.assign({}, resourceDateFilters[resource], {
      preset,
      startDate: range.startDate,
      endDate: range.endDate
    });
    renderList();
    return;
  }
  if (button.dataset.action === 'resource-date-custom') {
    const resource = button.dataset.resource || currentResource;
    const startDate = list.querySelector('[name="resourceStartDate"]')?.value || '';
    const endDate = list.querySelector('[name="resourceEndDate"]')?.value || '';
    if (!startDate || !endDate) {
      alert('请选择开始日期和结束日期。');
      return;
    }
    if (startDate > endDate) {
      alert('开始日期不能晚于结束日期。');
      return;
    }
    resourceDateFilters[resource] = { preset: 'custom', startDate, endDate };
    renderList();
    return;
  }
  if (button.dataset.action === 'resource-date-reset') {
    const resource = button.dataset.resource || currentResource;
    resourceDateFilters[resource] = { preset: 'all', startDate: '', endDate: '' };
    renderList();
    return;
  }
  if (button.dataset.action === 'interview-status-filter') {
    appointmentStatusFilter = button.dataset.status || 'all';
    renderList();
    return;
  }
  if (button.dataset.action === 'dashboard-date-preset') {
    await loadDashboard({ preset: button.dataset.preset || 'today', startDate: '', endDate: '', page: 1 });
    renderDashboard(dashboardData || {});
    return;
  }
  if (button.dataset.action === 'dashboard-apply-date') {
    const startDate = list.querySelector('[name="dashboardStartDate"]')?.value || '';
    const endDate = list.querySelector('[name="dashboardEndDate"]')?.value || '';
    if (!startDate || !endDate) {
      alert('\u8bf7\u9009\u62e9\u5f00\u59cb\u65e5\u671f\u548c\u7ed3\u675f\u65e5\u671f');
      return;
    }
    if (startDate > endDate) {
      alert('\u5f00\u59cb\u65e5\u671f\u4e0d\u80fd\u665a\u4e8e\u7ed3\u675f\u65e5\u671f');
      return;
    }
    await loadDashboard({ preset: 'custom', startDate, endDate, page: 1 });
    renderDashboard(dashboardData || {});
    return;
  }
  if (button.dataset.action === 'dashboard-reset') {
    dashboardFilters = {
      preset: 'today',
      startDate: '',
      endDate: '',
      metric: 'customersTotal',
      compareMetric: 'effectiveOperations',
      storeName: '',
      status: '',
      serviceType: '',
      keyword: '',
      page: 1,
      pageSize: 20
    };
    await loadDashboard();
    renderDashboard(dashboardData || {});
    return;
  }
  if (button.dataset.action === 'dashboard-metric') {
    const metric = button.dataset.metric || 'customersTotal';
    const compareMap = {
      customersTotal: 'newCustomers',
      todayCustomers: 'newCustomers',
      rangeCustomers: 'newCustomers',
      ayisTotal: 'newAyis',
      todayAyis: 'newAyis',
      rangeAyis: 'newAyis',
      demandsTotal: 'newDemands',
      effectiveOperations: 'effectiveOperations',
      ayiStatus: 'newAyis'
    };
    await loadDashboard({ metric, compareMetric: compareMap[metric] || dashboardFilters.compareMetric, page: 1 });
    renderDashboard(dashboardData || {});
    return;
  }
  if (button.dataset.action === 'dashboard-compare') {
    await loadDashboard({ compareMetric: button.dataset.metric || 'effectiveOperations', page: 1 });
    renderDashboard(dashboardData || {});
    return;
  }
  if (button.dataset.action === 'dashboard-store') {
    await loadDashboard({ storeName: button.dataset.store || '', page: 1 });
    renderDashboard(dashboardData || {});
    return;
  }
  if (button.dataset.action === 'dashboard-clear-store') {
    await loadDashboard({ storeName: '', page: 1 });
    renderDashboard(dashboardData || {});
    return;
  }
  if (button.dataset.action === 'dashboard-breakdown') {
    const next = { page: 1 };
    if (button.dataset.kind === 'serviceType') next.serviceType = button.dataset.value || '';
    else next.status = button.dataset.value || '';
    await loadDashboard(next);
    renderDashboard(dashboardData || {});
    return;
  }
  if (button.dataset.action === 'dashboard-filter') {
    await loadDashboard({
      status: list.querySelector('[name="dashboardStatus"]')?.value || '',
      serviceType: list.querySelector('[name="dashboardServiceType"]')?.value || '',
      keyword: list.querySelector('[name="dashboardKeyword"]')?.value || '',
      page: 1
    });
    renderDashboard(dashboardData || {});
    return;
  }
  if (button.dataset.action === 'dashboard-clear-filters') {
    await loadDashboard({ status: '', serviceType: '', keyword: '', page: 1 });
    renderDashboard(dashboardData || {});
    return;
  }
  if (button.dataset.action === 'dashboard-prev') {
    await loadDashboard({ page: Math.max(1, Number(dashboardFilters.page) - 1) });
    renderDashboard(dashboardData || {});
    return;
  }
  if (button.dataset.action === 'dashboard-next') {
    const details = dashboardData && dashboardData.details ? dashboardData.details : {};
    const totalPages = Math.max(1, Math.ceil((Number(details.total) || 0) / (Number(details.pageSize) || 20)));
    await loadDashboard({ page: Math.min(totalPages, Number(dashboardFilters.page) + 1) });
    renderDashboard(dashboardData || {});
    return;
  }
  if (button.dataset.action === 'audit-export') {
    try {
      await exportAuditLogs();
    } catch (error) {
      alert(`\u5bfc\u51fa\u5931\u8d25\uff1a${error.message}`);
    }
    return;
  }
  if (button.dataset.action === 'audit-filter') {
    await loadAuditLogs(collectAuditFilters(1));
    renderAuditLogs();
    return;
  }
  if (button.dataset.action === 'audit-reset') {
    auditLogFilters = {
      actor: '',
      role: '',
      entityType: '',
      action: '',
      startTime: '',
      endTime: '',
      keyword: '',
      page: 1,
      pageSize: 20
    };
    await loadAuditLogs();
    renderAuditLogs();
    return;
  }
  if (button.dataset.action === 'audit-prev') {
    await loadAuditLogs({ page: Math.max(1, Number(auditLogFilters.page) - 1) });
    renderAuditLogs();
    return;
  }
  if (button.dataset.action === 'audit-next') {
    await loadAuditLogs({ page: Math.min(auditLogTotalPages, Number(auditLogFilters.page) + 1) });
    renderAuditLogs();
    return;
  }
  if (button.dataset.action === 'export-preset') {
    const preset = button.dataset.preset || 'all';
    const range = exportPresetRange(preset);
    exportInfoFilters = Object.assign({}, exportInfoFilters, {
      preset,
      startDate: range.startDate,
      endDate: range.endDate,
      page: 1
    });
    await loadExportInfo();
    renderExportInfo();
    return;
  }
  if (button.dataset.action === 'export-query') {
    const nextFilters = collectExportInfoFilters(1);
    if (nextFilters.startDate && nextFilters.endDate && nextFilters.startDate > nextFilters.endDate) {
      alert('开始日期不能晚于结束日期');
      return;
    }
    await loadExportInfo(nextFilters);
    renderExportInfo();
    return;
  }
  if (button.dataset.action === 'export-reset') {
    const range = exportPresetRange('today');
    exportInfoFilters = {
      type: 'demands',
      preset: 'today',
      startDate: range.startDate,
      endDate: range.endDate,
      status: '',
      serviceType: '',
      store: '',
      operator: '',
      interviewMethod: '',
      page: 1,
      pageSize: 20
    };
    await loadExportInfo();
    renderExportInfo();
    return;
  }
  if (button.dataset.action === 'export-current') {
    await exportCurrentInfo();
    return;
  }
  if (button.dataset.action === 'export-prev') {
    await loadExportInfo({ page: Math.max(1, Number(exportInfoFilters.page) - 1) });
    renderExportInfo();
    return;
  }
  if (button.dataset.action === 'export-next') {
    const total = exportInfoResult ? Number(exportInfoResult.total) || 0 : 0;
    const totalPages = Math.max(1, Math.ceil(total / (Number(exportInfoFilters.pageSize) || 20)));
    await loadExportInfo({ page: Math.min(totalPages, Number(exportInfoFilters.page) + 1) });
    renderExportInfo();
    return;
  }
  if (button.dataset.action === 'todo-category') {
    await loadTodos({ category: button.dataset.category || 'today', page: 1 });
    renderTodos();
    return;
  }
  if (button.dataset.action === 'todo-filter') {
    await loadTodos(collectTodoFilters(1));
    renderTodos();
    return;
  }
  if (button.dataset.action === 'todo-reset') {
    todoFilters = { category: todoFilters.category || 'today', keyword: '', operatorId: '', page: 1, pageSize: 20 };
    await loadTodos();
    renderTodos();
    return;
  }
  if (button.dataset.action === 'todo-prev') {
    await loadTodos({ page: Math.max(1, Number(todoFilters.page) - 1) });
    renderTodos();
    return;
  }
  if (button.dataset.action === 'todo-next') {
    await loadTodos({ page: Math.min(todoTotalPages, Number(todoFilters.page) + 1) });
    renderTodos();
    return;
  }
  if (button.dataset.action === 'todo-detail') {
    const id = Number(button.dataset.id);
    const record = cache.find((item) => item.id === id) || { id };
    try {
      await openDemandDetailPanel(record);
    } catch (error) {
      alert(error.message || '加载客户详情失败');
    }
    return;
  }
  if (button.dataset.action === 'notification-read') {
    try {
      await api(`notifications/${button.dataset.id}/read`, { method: 'PUT' });
      await loadTodos();
      renderTodos();
    } catch (error) {
      alert('业务提醒标记失败，请稍后重试。');
    }
    return;
  }
  if (button.dataset.action === 'notification-filter') {
    const type = list.querySelector('[name="notificationType"]');
    const startDate = list.querySelector('[name="notificationStartDate"]');
    const endDate = list.querySelector('[name="notificationEndDate"]');
    if (startDate && endDate && startDate.value && endDate.value && startDate.value > endDate.value) {
      alert('开始日期不能晚于结束日期。');
      return;
    }
    notificationFilters = {
      messageType: type ? type.value : '',
      startDate: startDate ? startDate.value : '',
      endDate: endDate ? endDate.value : ''
    };
    await loadTodos();
    renderTodos();
    return;
  }
  if (button.dataset.action === 'notification-reset') {
    notificationFilters = { messageType: '', startDate: '', endDate: '' };
    await loadTodos();
    renderTodos();
    return;
  }
  if (button.dataset.action === 'notification-read-all') {
    try {
      await api('notifications/read-all', { method: 'PUT' });
      await loadTodos();
      renderTodos();
    } catch (error) {
      alert('业务提醒标记失败，请稍后重试。');
    }
    return;
  }
  if (button.dataset.action === 'toggle-account-group') {
    expandedAccountRole = expandedAccountRole === button.dataset.role ? null : button.dataset.role;
    renderAccountsList();
    return;
  }
  const id = Number(button.dataset.id);
  if (button.dataset.action === 'edit') {
    const record = cache.find((item) => item.id === id);
    if (!record) {
      alert('没有找到这条数据，请刷新后再试。');
      return;
    }
    openEditor(record);
    renderList();
    return;
  }
  if (button.dataset.action === 'match-demand') {
    const record = cache.find((item) => item.id === id);
    if (!record) {
      alert('没有找到这条需求，请刷新后再试。');
      return;
    }
    try {
      await openDemandMatchPanel(record);
    } catch (error) {
      alert(error.message || '加载推荐信息失败');
    }
    return;
  }
  if (button.dataset.action === 'demand-detail') {
    const record = cache.find((item) => item.id === id);
    if (!record) {
      alert('没有找到这条需求，请刷新后再试。');
      return;
    }
    try {
      await openDemandDetailPanel(record);
    } catch (error) {
      alert(error.message || '加载客户详情失败');
    }
    return;
  }
  if (button.dataset.action === 'view-demand-appointments') {
    appointmentDemandFilter = String(id);
    appointmentStatusFilter = 'all';
    setRoute('demands-interviews');
    return;
  }
  if (button.dataset.action === 'clear-appointment-demand-filter') {
    appointmentDemandFilter = '';
    renderList();
    return;
  }
  if (button.dataset.action === 'new-demand-appointment') {
    const record = cache.find((item) => item.id === id);
    if (!record) {
      alert('没有找到这条需求，请刷新后再试。');
      return;
    }
    openDemandAppointmentEditor(record);
    return;
  }
  if (button.dataset.action === 'open-linked-demand') {
    try {
      const demand = await api(`demands/${id}`);
      currentResource = 'demands';
      currentRoute = 'demands-list';
      currentRecord = demand;
      await openDemandDetailPanel(demand);
    } catch (error) {
      alert(error.message || '加载关联需求失败');
    }
    return;
  }
  if (button.dataset.action === 'change-appointment-status') {
    const record = cache.find((item) => item.id === id);
    if (!record) {
      alert('没有找到这条面试记录，请刷新后再试。');
      return;
    }
    openAppointmentStatusPanel(record);
    return;
  }
  if (button.dataset.action === 'ayi-availability') {
    const record = cache.find((item) => item.id === id);
    if (!record) {
      alert('没有找到这位阿姨，请刷新后再试。');
      return;
    }
    try {
      await openAyiAvailabilityPanel(record);
    } catch (error) {
      alert(error.message || '加载阿姨档期失败');
    }
    return;
  }
  if (button.dataset.action === 'delete' && confirm('确定删除这条数据？')) {
    const target = cache.find((item) => item.id === id);
    if (currentResource === 'accounts') {
      if (currentUser && target && target.id === currentUser.id) {
        alert('不能删除当前正在登录的账号。你可以先新建另一个管理端账号，再切换过去处理。');
        return;
      }
      if (target && displayRoleName(target.role) === '管理端') {
        const managementAccounts = cache.filter((item) => displayRoleName(item.role) === '管理端' && item.status !== '停用');
        if (managementAccounts.length <= 1) {
          alert('至少保留一个管理端账号，否则后台会进不去。');
          return;
        }
      }
    }

    try {
      const deletePath = currentResource === 'serviceModules' ? getServiceModuleApiPath(id) : `${currentResource}/${id}`;
      await api(deletePath, { method: 'DELETE' });
      await loadResource(currentResource, { route: currentRoute });
    } catch (error) {
      alert(error.message || '删除失败');
    }
  }
});

form.addEventListener('click', async (event) => {
  if (event.target.id === 'company-profile-reset') {
    renderCompanyProfileForm(currentRecord || {});
    return;
  }
  if (event.target.id === 'clearBtn') closeEditor();
  const assignmentButton = event.target.closest('[data-action="save-assignment"]');
  if (assignmentButton) {
    event.preventDefault();
    if (!currentRecord) return;
    assignmentButton.disabled = true;
    assignmentButton.textContent = '保存中...';
    try {
      const operatorSelect = form.querySelector('[name="assignedOperatorId"]');
      await api(`demands/${currentRecord.id}/assignment`, {
        method: 'PUT',
        body: JSON.stringify({ operatorId: operatorSelect && operatorSelect.value ? Number(operatorSelect.value) : null })
      });
      alert('负责人已更新。');
      await refreshCurrentDemandViews(currentRecord.id);
    } catch (error) {
      alert(error.message || '保存负责人失败');
      assignmentButton.disabled = false;
      assignmentButton.textContent = '保存负责人';
    }
    return;
  }

  const followButton = event.target.closest('[data-action="save-follow-up"]');
  if (followButton) {
    event.preventDefault();
    if (!currentRecord) return;
    followButton.disabled = true;
    followButton.textContent = '保存中...';
    try {
      await api(`demands/${currentRecord.id}/follow-ups`, {
        method: 'POST',
        body: JSON.stringify({
          method: form.querySelector('[name="followMethod"]').value,
          result: form.querySelector('[name="followResult"]').value,
          contactedAt: form.querySelector('[name="contactedAt"]').value,
          nextFollowUpAt: form.querySelector('[name="nextFollowUpAt"]').value,
          note: form.querySelector('[name="followNote"]').value
        })
      });
      alert('跟进记录已保存。');
      await refreshCurrentDemandViews(currentRecord.id);
    } catch (error) {
      alert(error.message || '保存跟进失败');
      followButton.disabled = false;
      followButton.textContent = '保存跟进';
    }
    return;
  }

  const appointmentStatusButton = event.target.closest('[data-action="save-appointment-status"]');
  if (appointmentStatusButton) {
    event.preventDefault();
    if (!currentRecord) return;
    const status = form.querySelector('[name="appointmentStatus"]')?.value || '';
    if (!interviewStatuses.includes(status)) {
      alert('请选择有效的面试状态。');
      return;
    }
    appointmentStatusButton.disabled = true;
    appointmentStatusButton.textContent = '保存中...';
    try {
      const updated = await api(`appointments/${currentRecord.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      alert('面试状态已更新。');
      const index = cache.findIndex((item) => item.id === currentRecord.id);
      if (index >= 0) cache[index] = updated;
      currentRecord = updated;
      renderList();
      openAppointmentStatusPanel(updated);
    } catch (error) {
      alert(error.message || '保存面试状态失败');
      appointmentStatusButton.disabled = false;
      appointmentStatusButton.textContent = '保存状态';
    }
    return;
  }

  const expireButton = event.target.closest('[data-action="expire-match"]');
  if (expireButton) {
    event.preventDefault();
    if (!confirm('确定将这条推荐标记为已失效？')) return;
    api(`demandMatches/${expireButton.dataset.id}/expire`, { method: 'POST' })
      .then(() => openDemandMatchPanel(currentRecord))
      .catch((error) => alert(error.message || '标记失效失败'));
  }
});

list.addEventListener('input', (event) => {
  const auditInput = event.target.closest('input[data-action="audit-search"]');
  if (auditInput) {
    auditLogSearchQuery = auditInput.value;
    renderAuditLogs();
    const nextInput = list.querySelector('input[data-action="audit-search"]');
    if (nextInput) {
      nextInput.focus();
      const position = nextInput.value.length;
      nextInput.setSelectionRange(position, position);
    }
    return;
  }

  const input = event.target.closest('input[data-action="category-search"]');
  if (!input) return;
  currentModuleSearchQuery = input.value;
  renderList();
  const nextInput = list.querySelector('input[data-action="category-search"]');
  if (nextInput) {
    nextInput.focus();
    const position = nextInput.value.length;
    nextInput.setSelectionRange(position, position);
  }
});

list.addEventListener('change', (event) => {
  const exportTypeSelect = event.target.closest('select[name="exportType"]');
  if (exportTypeSelect) {
    exportInfoFilters = Object.assign({}, exportInfoFilters, {
      type: exportTypeSelect.value,
      status: '',
      serviceType: '',
      store: '',
      operator: '',
      interviewMethod: '',
      page: 1
    });
    renderExportInfo();
  }
});

form.addEventListener('change', (event) => {
  const input = event.target.closest('[data-image-field]');
  if (!input || !input.files || !input.files[0]) return;

  const key = input.dataset.imageField;
  const reader = new FileReader();
  reader.onload = () => {
    pendingImages[key] = reader.result;
    const hidden = form.querySelector(`input[type="hidden"][name="${key}"]`);
    const preview = form.querySelector(`[data-preview="${key}"]`);
    if (hidden) hidden.value = reader.result;
    if (preview) {
      preview.innerHTML = `<img class="image-preview" src="${reader.result}" alt="图片预览" />`;
    }
  };
  reader.readAsDataURL(input.files[0]);
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (form.dataset.mode === 'company-profile') {
    const formData = new FormData(form);
    const payload = {};
    resources.companyProfile.fields.forEach(([key]) => {
      payload[key] = formData.get(key);
    });
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = '保存中...';
    }
    try {
      const profile = await api('company-profile', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      alert('公司基础信息已保存。');
      renderCompanyProfile(profile);
      renderCompanyProfileForm(profile);
    } catch (error) {
      alert(error.message || '保存公司基础信息失败');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = '保存修改';
      }
    }
    return;
  }
  if (form.dataset.mode === 'customer-home-hero') {
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = '保存中...';
    }
    const payload = {
      moduleType: 'highlight',
      title: formData.get('mainTitle'),
      summary: formData.get('subtitle'),
      iconText: '',
      theme: '',
      targetType: 'customer_home_hero',
      targetValue: JSON.stringify({
        primaryButtonText: formData.get('primaryButtonText'),
        primaryButtonTarget: formData.get('primaryButtonTarget'),
        secondaryButtonText: formData.get('secondaryButtonText'),
        secondaryButtonTarget: formData.get('secondaryButtonTarget')
      }),
      sort: 0,
      visible: true
    };
    try {
      if (currentRecord && currentRecord.id) {
        await api(`serviceModules/${currentRecord.id}?moduleType=highlight`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await api('serviceModules?moduleType=highlight', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      alert('顶部主视觉已保存。');
      const feature = getCompanyServiceFeatureByRoute(currentRoute);
      await renderCustomerHomeHero(feature);
    } catch (error) {
      alert(error.message || '保存顶部主视觉失败');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = '保存顶部主视觉';
      }
    }
    return;
  }
  if (form.dataset.mode === 'demand-match') {
    const formData = new FormData(form);
    try {
      await api(`demands/${form.dataset.demandId}/matches`, {
        method: 'POST',
        body: JSON.stringify({
          ayiId: Number(formData.get('ayiId')),
          recommendNote: formData.get('recommendNote')
        })
      });
      alert('已保存推荐。');
      const demandId = Number(form.dataset.demandId);
      await loadResource('demands');
      const record = cache.find((item) => item.id === demandId);
      if (record) await openDemandMatchPanel(record);
    } catch (error) {
      alert(error.message || '保存推荐失败');
    }
    return;
  }
  if (form.dataset.mode === 'ayi-availability') {
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = '保存中...';
    }
    const ayiId = form.dataset.ayiId;
    try {
      await api(`ayis/${ayiId}/availability`, {
        method: 'PUT',
        body: JSON.stringify({
          serviceStatus: formData.get('serviceStatus'),
          availableFrom: formData.get('availableFrom'),
          availableTo: formData.get('availableTo'),
          longTermAvailable: formData.has('longTermAvailable'),
          serviceWeekdays: formData.getAll('serviceWeekdays').map(Number),
          serviceTimeSlots: formData.getAll('serviceTimeSlots'),
          scheduleNote: formData.get('scheduleNote')
        })
      });
      await api(`ayis/${ayiId}/preferences`, {
        method: 'PUT',
        body: JSON.stringify({
          regions: String(formData.get('regions') || '').split(',').map((item) => item.trim()).filter(Boolean),
          serviceTypeIds: formData.getAll('serviceTypeIds').map(Number),
          acceptLiveIn: formData.has('acceptLiveIn'),
          acceptDayShift: formData.has('acceptDayShift'),
          acceptNightShift: formData.has('acceptNightShift'),
          acceptLongTerm: formData.has('acceptLongTerm'),
          acceptTemporary: formData.has('acceptTemporary'),
          minSalary: formData.get('minSalary'),
          maxSalary: formData.get('maxSalary'),
          earliestStartDate: formData.get('earliestStartDate'),
          note: formData.get('note')
        })
      });
      alert('阿姨档期和接单偏好已保存。');
      await loadResource('ayis');
      const record = cache.find((item) => Number(item.id) === Number(ayiId)) || currentRecord;
      if (record) await openAyiAvailabilityPanel(record);
    } catch (error) {
      alert(error.message || '保存阿姨档期失败');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = '保存档期和偏好';
      }
    }
    return;
  }
  const formData = new FormData(form);
  const payload = {};
  getCurrentFields().forEach(([key]) => {
    payload[key] = normalizeValue(key, pendingImages[key] || formData.get(key));
  });
  if (currentResource === 'accounts' && payload.role) {
    payload.role = normalizeRoleForSave(payload.role);
  }
  const activeServiceSection = currentResource === 'serviceModules' ? getServiceModuleSectionByRoute(currentRoute) : null;
  if (activeServiceSection) {
    payload.moduleType = activeServiceSection.moduleType;
    if (activeServiceSection.filterTargetType) {
      payload.targetType = activeServiceSection.filterTargetType;
    }
    if (activeServiceSection.filterTargetValue) {
      payload.targetValue = activeServiceSection.filterTargetValue;
    }
  }

  if (currentRecord) {
    const updatePath = currentResource === 'serviceModules' ? getServiceModuleApiPath(currentRecord.id) : `${currentResource}/${currentRecord.id}`;
    await api(updatePath, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    alert('已保存修改。');
  } else {
    const createPath = currentResource === 'serviceModules' ? getServiceModuleApiPath() : currentResource;
    await api(createPath, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    alert('已保存新增。');
  }
  if (currentResource === 'serviceModules') {
    const section = getServiceModuleSectionByRoute(currentRoute);
    if (section) {
      if (currentRecord) await renderServiceModuleItemPage(section, currentRecord.id);
      else await renderServiceModuleSectionHome(section);
      return;
    }
  }
  await loadResource(currentResource, { route: currentRoute });
});

async function boot() {
  authToken = localStorage.getItem('ygby_auth_token');
  if (!authToken) {
    clearAuth('');
    return;
  }
  try {
    const me = await api('auth/me');
    currentUser = me.user;
    allowedResources = me.allowedResources || [];
    if (!me.canUseBackstage) {
      clearAuth('该账号不能进入后台，请使用运营端或管理端账号。');
      return;
    }
    applyAuthShell();
    if (!location.hash || location.hash === '#') {
      setRoute('home');
    } else {
      await renderRoute();
    }
  } catch (error) {
    clearAuth('登录已过期，请重新登录。');
  }
}

window.addEventListener('hashchange', () => {
  renderRoute().catch((error) => {
    alert(error.message || '页面加载失败');
  });
});

boot();

// V6 staff management and analytics interface.
(() => {
  const ROLE_LABELS_V6 = {
    boss: '管理',
    management: '管理',
    operator: '运营',
    store_manager: '店长',
    store_staff: '店员'
  };
  const STATUS_LABELS_V6 = {
    active: '启用',
    disabled: '停用',
    locked: '锁定'
  };
  const ORG_LABELS_V6 = {
    headquarters: '总部/运营中心',
    operations_center: '总部/运营中心',
    store: '门店',
    backstage: '后台'
  };
  const DASHBOARD_METRICS_V6 = [
    ['newAyis', '新增阿姨'],
    ['newCustomers', '新增客户'],
    ['newDemands', '新增需求'],
    ['newAppointments', '新增面试'],
    ['newFollowUps', '跟进数量'],
    ['completedFollowUps', '完成跟进'],
    ['effectiveOperations', '有效操作']
  ];
  const MODULES_V6 = [
    ['dashboard', '首页经营数据'],
    ['customers', '客户管理'],
    ['ayis', '阿姨管理'],
    ['demands', '客户需求'],
    ['appointments', '面试安排'],
    ['todos', '跟进待办'],
    ['appointmentRecords', '预约记录'],
    ['stores', '门店信息'],
    ['exportInfo', '导出信息'],
    ['serviceModules', '公司服务配置'],
    ['accounts', '账号与权限'],
    ['auditLogs', '审计日志']
  ];
  let v6Stores = [];
  let v6StaffAccounts = [];
  let v6OneTimePassword = null;
  let v6ProfileData = null;

  const legacyClearAuthV6 = clearAuth;
  clearAuth = function clearAuthV6(message = '') {
    document.body.classList.remove('must-change-password');
    return legacyClearAuthV6(message);
  };

  function friendlyErrorV6(status, payload, fallback = '账号数据加载失败，请刷新后重试') {
    const code = payload && payload.code;
    const text = payload && (payload.error || payload.message);
    if (status === 401 && code === 'INVALID_CREDENTIALS') return '当前密码错误';
    if (status === 401) return '登录状态已失效，请重新登录';
    if (status === 403) return code === 'PASSWORD_CHANGE_REQUIRED' ? '首次登录需要先设置新密码' : '您没有账号管理权限';
    if (status === 404 && String(text || '').includes('Unknown auth endpoint')) return '后台服务尚未加载最新版本，请重启服务';
    if (status >= 500) return '后台服务暂时不可用，请稍后重试';
    return fallback;
  }

  api = async function apiV6(path, options) {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    const response = await fetch(`/api/${path}`, { headers, ...options });
    const raw = response.status === 204 ? '' : await response.text();
    let payload = null;
    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch (error) {
      payload = null;
    }
    if (!response.ok) {
      if (response.status === 401 && !['auth/login', 'auth/change-password'].includes(path)) clearAuth('登录状态已失效，请重新登录');
      if (response.status === 403 && payload && payload.code === 'PASSWORD_CHANGE_REQUIRED') {
        if (currentUser) currentUser.mustChangePassword = true;
        document.body.classList.add('must-change-password');
        if (getRouteFromHash() !== 'change-password') setRoute('change-password');
      }
      throw new Error(friendlyErrorV6(response.status, payload));
    }
    return payload;
  };

  roleDisplayMap.boss = '管理';
  roleDisplayMap.management = '管理';
  roleDisplayMap.operator = '运营';
  roleDisplayMap.store_manager = '店长';
  roleDisplayMap.store_staff = '店员';
  Object.assign(roleAccess, {
    boss: ['dashboard', 'accounts', 'auditLogs', 'exportInfo', 'todos', 'companyProfile', 'ayis', 'demands', 'appointments', 'applications', 'orders', 'orderDispatches', 'stores', 'serviceModules', 'banners', 'profile', 'changePassword'],
    management: ['dashboard', 'accounts', 'auditLogs', 'exportInfo', 'todos', 'companyProfile', 'ayis', 'demands', 'appointments', 'applications', 'orders', 'orderDispatches', 'stores', 'serviceModules', 'banners', 'profile', 'changePassword'],
    operator: ['dashboard', 'accounts', 'exportInfo', 'todos', 'ayis', 'demands', 'appointments', 'applications', 'orders', 'orderDispatches', 'stores', 'serviceModules', 'banners', 'profile', 'changePassword'],
    store_manager: ['dashboard', 'accounts', 'todos', 'ayis', 'demands', 'appointments', 'applications', 'orders', 'orderDispatches', 'stores', 'profile', 'changePassword'],
    store_staff: ['dashboard', 'todos', 'ayis', 'demands', 'appointments', 'applications', 'orders', 'orderDispatches', 'stores', 'profile', 'changePassword']
  });
  resources.profile = { title: '个人信息', desc: '查看当前账号资料、权限、授权门店和我的工作数据。', custom: 'profile' };
  resources.changePassword = { title: '首次登录，请设置新密码', desc: '您当前使用的是临时密码。设置新密码后才能进入后台。', custom: 'changePassword' };
  routeToResourceMap.profile = 'profile';
  routeToResourceMap['change-password'] = 'changePassword';
  resourceToRouteMap.profile = 'profile';
  resourceToRouteMap.changePassword = 'change-password';

  function setupV6Shell() {
    document.title = '北京阳光北亚家政后台';
    const brand = document.querySelector('.login-brand');
    if (brand) brand.textContent = '北京阳光北亚家政';
    const loginTitle = document.querySelector('.login-card h1');
    if (loginTitle) loginTitle.textContent = '后台登录';
    const loginDesc = document.querySelector('.login-card p');
    if (loginDesc) loginDesc.textContent = '使用手机号和密码登录。角色、门店和权限由后台账号决定。';
    const identifier = loginForm.querySelector('[name="identifier"]');
    if (identifier) {
      identifier.placeholder = '请输入手机号';
      identifier.autocomplete = 'tel';
      const label = identifier.closest('.field')?.querySelector('label');
      if (label) label.textContent = '手机号';
      const remembered = localStorage.getItem('ygby_remembered_phone') || '';
      if (remembered) identifier.value = remembered;
    }
    const passwordLabel = loginForm.querySelector('[name="password"]')?.closest('.field')?.querySelector('label');
    if (passwordLabel) passwordLabel.textContent = '密码';
    const loginButton = loginForm.querySelector('button[type="submit"]');
    if (loginButton) loginButton.textContent = '登录';
    if (!loginForm.querySelector('[name="rememberPhone"]')) {
      loginForm.insertAdjacentHTML('beforeend', `
        <label class="login-remember"><input type="checkbox" name="rememberPhone" checked> 记住手机号</label>
        <p class="login-help">忘记密码请联系管理员</p>
      `);
    }
    const title = document.querySelector('.topbar h1');
    if (title) title.textContent = '北京阳光北亚家政后台';
    const desc = document.querySelector('.topbar p');
    if (desc) desc.textContent = '后台员工工作台，账号权限和数据范围由后端统一校验。';
    if (!document.querySelector('[data-route="profile"]')) {
      document.querySelector('.tabs')?.insertAdjacentHTML('beforeend', '<button class="tab" data-route="profile" data-resource="profile">个人信息</button>');
    }
    document.querySelector('[data-route="dashboard"]') && (document.querySelector('[data-route="dashboard"]').textContent = '每日数据');
    document.querySelector('[data-route="accounts"]') && (document.querySelector('[data-route="accounts"]').textContent = '账号与权限');
    document.querySelector('[data-route="home"]') && (document.querySelector('[data-route="home"]').textContent = '首页');
    document.querySelector('[data-route="todos"]') && (document.querySelector('[data-route="todos"]').textContent = '跟进待办');
    document.querySelector('[data-route="exports"]') && (document.querySelector('[data-route="exports"]').textContent = '导出信息');
    document.querySelector('[data-route="company-services"]') && (document.querySelector('[data-route="company-services"]').textContent = '公司服务配置');
    document.querySelector('[data-route="audit-logs"]') && (document.querySelector('[data-route="audit-logs"]').textContent = '审计日志');
  }

  function labelRoleV6(role) {
    return ROLE_LABELS_V6[role] || role || '-';
  }

  function labelStatusV6(status) {
    return STATUS_LABELS_V6[status] || status || '-';
  }

  function labelOrgV6(value) {
    return ORG_LABELS_V6[value] || value || '待完善归属';
  }

  function displayNameV7(user = currentUser) {
    const rawName = String(user?.name || '').trim();
    const rawUsername = String(user?.username || '').trim();
    const roleLabel = labelRoleV6(user?.role);
    const isPhoneLike = /^\d{7,}$/.test(rawUsername);
    if (rawName.length >= 2) return rawName;
    if (!isPhoneLike && rawUsername.length >= 2) return rawUsername;
    return roleLabel === '管理' ? '后台管理员' : '后台员工';
  }

  function orgNameV7(user = currentUser) {
    const storeId = user?.storeId || user?.store_id;
    return user?.store?.name
      || (storeId ? storeNameV6(storeId) : '')
      || labelOrgV6(user?.organizationType || user?.organization_type)
      || '待完善归属';
  }

  function routeLabelV7(route) {
    const labels = {
      home: '首页经营数据',
      dashboard: '每日数据',
      accounts: '员工账号',
      'audit-logs': '审计日志',
      todos: '跟进待办',
      ayis: '阿姨管理',
      demands: '客户需求',
      'demands-list': '客户列表',
      'demands-interviews': '面试安排',
      appointments: '预约记录',
      exports: '导出信息',
      applications: '接单申请',
      orders: '订单跟进',
      dispatches: '人工派单',
      stores: '门店信息',
      'company-services': '公司服务配置',
      profile: '个人信息',
      'change-password': '修改密码'
    };
    return labels[route] || sectionTitle.textContent || '后台';
  }

  function routeGroupV7(route) {
    if (['home', 'dashboard'].includes(route)) return '首页';
    if (['demands', 'demands-list'].includes(route)) return '客户管理';
    if (['demands-interviews', 'appointments'].includes(route)) return '面试安排';
    if (route === 'accounts') return '账号与权限';
    if (route === 'audit-logs') return '审计日志';
    if (route === 'exports') return '导出信息';
    if (route === 'todos') return '跟进待办';
    if (route === 'stores') return '门店信息';
    if (['company-services'].includes(route) || route.startsWith('company-services/')) return '公司服务配置';
    return routeLabelV7(route);
  }

  function syncShellChromeV7() {
    const route = getRouteFromHash() || currentRoute || 'home';
    const title = sectionTitle.textContent || routeLabelV7(route);
    if (topPageTitle) topPageTitle.textContent = title;
    if (topBreadcrumb) topBreadcrumb.textContent = `${routeGroupV7(route)} / ${routeLabelV7(route)}`;
    if (currentOrgLabel) currentOrgLabel.textContent = orgNameV7();
    if (notificationCount) notificationCount.textContent = String(Array.isArray(backstageNotifications) ? backstageNotifications.length : 0);
  }

  function setAccountMenuOpenV7(open) {
    if (!accountDropdown || !accountMenuBtn) return;
    accountDropdown.hidden = !open;
    accountMenuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function openProfileDrawer() {
    setAccountMenuOpenV7(false);
    setRoute('profile');
  }

  function openPasswordEntryV7() {
    setAccountMenuOpenV7(false);
    setRoute('profile');
  }

  async function logoutV7() {
    setAccountMenuOpenV7(false);
    try {
      await api('auth/logout', { method: 'POST' });
    } catch (error) {
      // Local logout should still clear the browser state if the session already expired.
    }
    clearAuth('已退出，请重新登录。');
  }

  function fmtV6(value) {
    return value ? formatDateTime(value) : '-';
  }

  function metricV6(source, key) {
    return Number((source && source.metrics && source.metrics[key]) || 0);
  }

  function storeNameV6(storeId) {
    const store = v6Stores.find((item) => Number(item.id) === Number(storeId));
    return store ? store.name : (storeId ? `门店 ${storeId}` : '待完善归属');
  }

  function permissionLabelsV6(permissions = []) {
    const set = new Set(Array.isArray(permissions) ? permissions : []);
    return MODULES_V6.filter(([key]) => set.has(key)).map(([, label]) => label);
  }

  function permissionTagsV6(permissions = []) {
    const labels = permissionLabelsV6(permissions);
    return labels.length
      ? labels.map((item) => `<span class="permission-tag">${escapeHtml(item)}</span>`).join('')
      : '<span class="permission-tag empty">未授权模块</span>';
  }

  async function loadStoresV6() {
    try {
      v6Stores = await api('stores');
    } catch (error) {
      v6Stores = [];
    }
  }

  function applyAuthShellV6() {
    if (!currentUser || !roleAccess[currentUser.role]) {
      document.body.classList.remove('is-authed');
      document.body.classList.remove('must-change-password');
      return;
    }
    document.body.classList.add('is-authed');
    document.body.classList.toggle('must-change-password', Boolean(currentUser.mustChangePassword));
    const displayName = displayNameV7(currentUser);
    currentUserLabel.textContent = currentUser.mustChangePassword
      ? '首次登录，请设置新密码'
      : `${displayName} / ${labelRoleV6(currentUser.role)}`;
    if (currentOrgLabel) currentOrgLabel.textContent = orgNameV7(currentUser);
    if (notificationCount) notificationCount.textContent = String(Array.isArray(backstageNotifications) ? backstageNotifications.length : 0);
    const allowed = new Set(getAllowedResources().concat('profile', 'changePassword'));
    if (currentUser.mustChangePassword) {
      allowed.clear();
      allowed.add('changePassword');
    }
    document.querySelectorAll('.tab').forEach((tab) => {
      tab.hidden = tab.dataset.route !== 'home' && !allowed.has(tab.dataset.resource);
    });
  }

  applyAuthShell = applyAuthShellV6;

  function getAllowedResourcesV6() {
    if (!currentUser) return [];
    const base = allowedResources.length ? allowedResources.filter((item) => resources[item]) : (roleAccess[currentUser.role] || []);
    return Array.from(new Set(base.concat('profile', 'changePassword')));
  }

  getAllowedResources = getAllowedResourcesV6;

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const formData = new FormData(loginForm);
    const identifierValue = String(formData.get('identifier') || '').trim();
    loginTip.textContent = '';
    try {
      const result = await api('auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: identifierValue,
          password: formData.get('password')
        })
      });
      authToken = result.token;
      localStorage.setItem('ygby_auth_token', authToken);
      if (formData.get('rememberPhone')) localStorage.setItem('ygby_remembered_phone', identifierValue);
      else localStorage.removeItem('ygby_remembered_phone');
      const me = await api('auth/me');
      currentUser = me.user;
      allowedResources = me.allowedResources || [];
      if (!me.canUseBackstage) {
        clearAuth('该账号不能进入后台。');
        return;
      }
      loginForm.querySelector('[name="password"]').value = '';
      applyAuthShell();
      setRoute(currentUser.mustChangePassword ? 'change-password' : 'home');
    } catch (error) {
      loginTip.textContent = '手机号或密码错误';
    }
  }, true);

  const legacyLoadResource = loadResource;
  loadResource = async function loadResourceV6(resource = currentResource, options = {}) {
    if (resource === 'changePassword') {
      currentResource = 'changePassword';
      currentRoute = 'change-password';
      currentRecord = null;
      closeEditor();
      markActiveRoute('change-password');
      sectionTitle.textContent = '首次登录，请设置新密码';
      sectionDesc.textContent = '您当前使用的是临时密码。设置新密码后才能进入后台。';
      document.querySelector('#addBtn').hidden = true;
      list.innerHTML = `
        <section class="forced-password-card">
          <h3>首次登录，请设置新密码</h3>
          <p>您当前使用的是临时密码。设置新密码后才能进入后台。</p>
        </section>
      `;
      renderProfileFormV6(true);
      editor.classList.add('is-open');
      layout.classList.add('editor-open');
      return;
    }
    if (resource === 'dashboard') {
      currentResource = 'dashboard';
      currentRoute = 'dashboard';
      currentRecord = null;
      closeEditor();
      markActiveRoute('dashboard');
      sectionTitle.textContent = '每日数据看板';
      sectionDesc.textContent = '按日期查看门店、员工和本人工作数据。';
      document.querySelector('#addBtn').hidden = true;
      await loadDashboard();
      renderDashboard(dashboardData || {});
      form.innerHTML = '<p class="muted">每日数据由后台操作快照统计，跨门店明细按角色权限过滤。</p>';
      formTitle.textContent = '数据口径';
      return;
    }
    if (resource === 'accounts') {
      currentResource = 'accounts';
      currentRoute = 'accounts';
      currentRecord = null;
      closeEditor();
      markActiveRoute('accounts');
      sectionTitle.textContent = '账号与权限';
      sectionDesc.textContent = '创建员工账号、分配模块权限、管理状态和会话。';
      document.querySelector('#addBtn').hidden = false;
      try {
        await loadStoresV6();
        const result = await api('auth/staff-accounts');
        v6StaffAccounts = result.accounts || [];
        cache = v6StaffAccounts;
        renderAccountsList();
      } catch (error) {
        v6StaffAccounts = [];
        cache = [];
        list.innerHTML = `<section class="account-note">${escapeHtml(error.message || '账号数据加载失败，请刷新后重试')}</section>`;
      }
      form.innerHTML = '<p class="muted">创建账号后临时密码只显示一次；关闭提示后不能再次查看。</p>';
      formTitle.textContent = '账号操作';
      return;
    }
    if (resource === 'profile') {
      currentResource = 'profile';
      currentRoute = 'profile';
      currentRecord = null;
      closeEditor();
      markActiveRoute('profile');
      sectionTitle.textContent = '个人信息';
      sectionDesc.textContent = '查看本人资料、权限、授权门店和我的工作数据。';
      document.querySelector('#addBtn').hidden = true;
      await loadStoresV6();
      const [me, work] = await Promise.all([api('auth/me'), api('analytics/my')]);
      currentUser = me.user;
      allowedResources = me.allowedResources || allowedResources;
      v6ProfileData = work;
      renderProfileV6();
      renderProfileFormV6();
      editor.classList.add('is-open');
      layout.classList.add('editor-open');
      return;
    }
    return legacyLoadResource(resource, options);
  };

  const legacyRenderRoute = renderRoute;
  renderRoute = async function renderRouteV6() {
    if (!currentUser || !roleAccess[currentUser.role]) return;
    if (currentUser.mustChangePassword && getRouteFromHash() !== 'change-password') {
      setRoute('change-password');
      return;
    }
    return legacyRenderRoute();
  };

  loadDashboard = async function loadDashboardV6(nextFilters = {}) {
    dashboardFilters = Object.assign({}, dashboardFilters, nextFilters);
    const query = dashboardQueryString();
    dashboardData = await api(`analytics${query ? `?${query}` : ''}`);
    if (dashboardData && dashboardData.range) {
      dashboardFilters.preset = dashboardData.range.preset || dashboardFilters.preset;
      dashboardFilters.startDate = dashboardData.range.startDate || dashboardFilters.startDate;
      dashboardFilters.endDate = dashboardData.range.endDate || dashboardFilters.endDate;
    }
    return dashboardData;
  };

  renderDashboard = function renderDashboardV6(data = {}) {
    const overview = data.metrics ? data : {};
    const stores = data.stores || [];
    const staff = data.staff || [];
    const trends = data.trends || [];
    list.innerHTML = `
      ${renderDashboardFilters(data.range || {})}
      <div class="metric-grid">
        ${DASHBOARD_METRICS_V6.filter(([key]) => key !== 'completedFollowUps').map(([key, label]) => `
          <button type="button" class="metric-card ${dashboardFilters.metric === key ? 'is-active' : ''}" data-action="dashboard-metric" data-metric="${key}">
            <span>${label}</span>
            <strong>${metricV6(overview, key)}</strong>
          </button>
        `).join('')}
      </div>
      <div class="dashboard-grid">
        ${renderTrendV6('阿姨新增趋势', trends, 'newAyis')}
        ${renderTrendV6('客户新增趋势', trends, 'newCustomers')}
        ${renderTrendV6('需求新增趋势', trends, 'newDemands')}
        ${renderStoreCompareV6(stores)}
      </div>
      ${renderDashboardTableV6('门店统计', ['门店', '新增阿姨', '新增客户', '新增需求', '新增面试', '新增预约', '跟进记录', '有效操作'], stores.map((row) => [
        row.name || '待完善归属',
        metricV6(row, 'newAyis'),
        metricV6(row, 'newCustomers'),
        metricV6(row, 'newDemands'),
        metricV6(row, 'newInterviews') || metricV6(row, 'newAppointments'),
        metricV6(row, 'newAppointments'),
        metricV6(row, 'newFollowUps'),
        metricV6(row, 'effectiveOperations')
      ]))}
      ${renderDashboardTableV6('员工统计', ['姓名', '角色', '所属门店', '新增阿姨', '新增客户', '新增需求', '新增面试', '新增预约', '跟进记录', '有效操作', '最近操作时间'], staff.map((row) => [
        row.name || '未知员工',
        labelRoleV6(row.role),
        storeNameV6(row.storeId),
        metricV6(row, 'newAyis'),
        metricV6(row, 'newCustomers'),
        metricV6(row, 'newDemands'),
        metricV6(row, 'newInterviews') || metricV6(row, 'newAppointments'),
        metricV6(row, 'newAppointments'),
        metricV6(row, 'newFollowUps'),
        metricV6(row, 'effectiveOperations'),
        fmtV6(row.lastOperationAt)
      ]))}
    `;
  };

  function renderTrendV6(title, rows, metricKey) {
    const values = rows.map((row) => metricV6(row, metricKey));
    const max = Math.max(1, ...values);
    return `
      <section class="dashboard-card">
        <div class="dashboard-card-head"><h3>${escapeHtml(title)}</h3><p>与当前日期筛选一致</p></div>
        <div class="v6-trend">
          ${rows.map((row) => {
            const value = metricV6(row, metricKey);
            return `<div><i style="height:${Math.max(4, value / max * 96)}%"></i><span>${escapeHtml(String(row.date || '').slice(5))}</span><strong>${value}</strong></div>`;
          }).join('') || '<p class="muted">暂无趋势数据</p>'}
        </div>
      </section>
    `;
  }

  function renderStoreCompareV6(rows) {
    const max = Math.max(1, ...rows.map((row) => metricV6(row, 'effectiveOperations')));
    return `
      <section class="dashboard-card">
        <div class="dashboard-card-head"><h3>门店有效操作对比</h3><p>公司合计 = 门店 + 总部/运营中心 + 待完善归属</p></div>
        <div class="dashboard-bars">
          ${rows.map((row) => {
            const value = metricV6(row, 'effectiveOperations');
            return `<button type="button" class="dashboard-bar-row" data-action="dashboard-store" data-store="${escapeHtml(row.storeId || '')}">
              <span>${escapeHtml(row.name || '待完善归属')}</span><i style="width:${Math.max(4, value / max * 100)}%"></i><strong>${value}</strong>
            </button>`;
          }).join('') || '<p class="muted">暂无门店统计</p>'}
        </div>
      </section>
    `;
  }

  function renderDashboardTableV6(title, headers, rows) {
    return `
      <section class="dashboard-table v6-table">
        <h3>${escapeHtml(title)}</h3>
        <table>
          <thead><tr>${headers.map((item) => `<th>${escapeHtml(item)}</th>`).join('')}</tr></thead>
          <tbody>${rows.length ? rows.map((row) => `<tr>${row.map((item) => `<td>${escapeHtml(item)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${headers.length}">暂无数据</td></tr>`}</tbody>
        </table>
      </section>
    `;
  }

  function renderAccountsListV6() {
    const rows = v6StaffAccounts;
    list.innerHTML = `
      ${v6OneTimePassword ? `
        <section class="temp-password-panel">
          <div><strong>临时密码只显示一次</strong><p>${escapeHtml(v6OneTimePassword.name)} / ${escapeHtml(v6OneTimePassword.phone_masked || '')}</p></div>
          <code>${escapeHtml(v6OneTimePassword.temporary_password)}</code>
          <button type="button" data-action="copy-temp-password">复制</button>
          <button type="button" class="secondary" data-action="close-temp-password">关闭</button>
        </section>
      ` : ''}
      <section class="dashboard-table v6-table">
        <h3>后台员工账号</h3>
        <table>
          <thead>
            <tr><th>姓名</th><th>手机号</th><th>角色</th><th>所属组织</th><th>所属门店</th><th>权限摘要</th><th>状态</th><th>最近登录</th><th>密码修改时间</th><th>创建人</th><th>创建时间</th><th>操作</th></tr>
          </thead>
          <tbody>
            ${rows.length ? rows.map((item) => `
              <tr>
                <td>${escapeHtml(item.name || '-')}</td>
                <td>${escapeHtml(item.phone_masked || item.phone || '-')}</td>
                <td>${escapeHtml(labelRoleV6(item.role))}</td>
                <td>${escapeHtml(labelOrgV6(item.organization_type))}</td>
                <td>${escapeHtml(item.store?.name || storeNameV6(item.store_id))}</td>
                <td><div class="permission-list compact">${permissionTagsV6(item.permissions)}</div></td>
                <td><span class="status-badge ${getStatusClass(labelStatusV6(item.account_status))}">${escapeHtml(labelStatusV6(item.account_status))}</span></td>
                <td>${escapeHtml(fmtV6(item.last_login_at))}</td>
                <td>${escapeHtml(fmtV6(item.password_changed_at))}</td>
                <td>${escapeHtml(item.created_by_name || '-')}</td>
                <td>${escapeHtml(fmtV6(item.created_at))}</td>
                <td class="record-actions">
                  <button type="button" data-action="staff-edit" data-id="${item.account_id}">编辑</button>
                  <button type="button" data-action="staff-reset-password" data-id="${item.account_id}">重置密码</button>
                  <button type="button" data-action="staff-disable" data-id="${item.account_id}">停用</button>
                  <button type="button" data-action="staff-unlock" data-id="${item.account_id}">启用/解锁</button>
                  <button type="button" data-action="staff-force-logout" data-id="${item.account_id}">强制退出</button>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="12">暂无可管理账号</td></tr>'}
          </tbody>
        </table>
      </section>
    `;
  }
  renderAccountsList = renderAccountsListV6;

  function renderStaffAccountFormV6(record = null) {
    currentRecord = record;
    form.dataset.mode = 'staff-account';
    formTitle.textContent = record ? '编辑账号' : '新增账号';
    const permissions = new Set(record?.permissions || []);
    form.innerHTML = `
      <div class="field"><label>姓名</label><input name="name" required value="${escapeHtml(record?.name || '')}"></div>
      <div class="field"><label>手机号</label><input name="phone" ${record ? 'disabled' : 'required'} value="${escapeHtml(record?.phone || '')}"></div>
      <div class="field"><label>角色</label><select name="role">${['operator', 'store_manager', 'store_staff'].map((role) => `<option value="${role}" ${record?.role === role ? 'selected' : ''}>${labelRoleV6(role)}</option>`).join('')}</select></div>
      <div class="field"><label>所属组织</label><select name="organization_type"><option value="backstage">后台</option><option value="headquarters" ${record?.organization_type === 'headquarters' ? 'selected' : ''}>总部/运营中心</option><option value="store" ${record?.organization_type === 'store' ? 'selected' : ''}>门店</option></select></div>
      <div class="field"><label>所属门店</label><select name="store_id"><option value="">待完善归属</option>${v6Stores.map((store) => `<option value="${store.id}" ${Number(record?.store_id) === Number(store.id) ? 'selected' : ''}>${escapeHtml(store.name)}</option>`).join('')}</select></div>
      <div class="field"><label>账号状态</label><select name="account_status"><option value="active">启用</option><option value="disabled" ${record?.account_status === 'disabled' ? 'selected' : ''}>停用</option><option value="locked" ${record?.account_status === 'locked' ? 'selected' : ''}>锁定</option></select></div>
      <div class="field"><label>模块权限</label><div class="permission-checkboxes">${MODULES_V6.map(([key, label]) => `<label><input type="checkbox" name="permissions" value="${key}" ${permissions.has(key) ? 'checked' : ''}> ${label}</label>`).join('')}</div></div>
      <button type="submit">${record ? '保存账号' : '创建账号'}</button>
    `;
  }

  const legacyOpenEditor = openEditor;
  openEditor = function openEditorV6(record = null) {
    if (currentResource === 'accounts') {
      renderStaffAccountFormV6(record);
      editor.classList.add('is-open');
      layout.classList.add('editor-open');
      return;
    }
    return legacyOpenEditor(record);
  };

  function renderProfileV6() {
    const user = currentUser || {};
    const metrics = v6ProfileData?.overview?.metrics || v6ProfileData?.metrics || {};
    list.innerHTML = `
      <section class="profile-grid">
        <article class="profile-card">
          <h3>账号资料</h3>
          <p>姓名：${escapeHtml(user.name || '-')}</p>
          <p>手机号：${escapeHtml(user.phoneMasked || user.phone_masked || '-')}</p>
          <p>角色：${escapeHtml(labelRoleV6(user.role))}</p>
          <p>所属组织：${escapeHtml(labelOrgV6(user.organizationType))}</p>
          <p>所属门店：${escapeHtml(user.store?.name || storeNameV6(user.storeId))}</p>
          <p>授权门店：${escapeHtml((user.storeScopeIds || []).map(storeNameV6).join('、') || '待完善归属')}</p>
          <p>账号状态：${escapeHtml(labelStatusV6(user.accountStatus || user.status))}</p>
          <p>最近登录时间：${escapeHtml(fmtV6(user.lastLoginAt))}</p>
          <p>密码修改时间：${escapeHtml(fmtV6(user.passwordChangedAt))}</p>
          <p>创建时间：${escapeHtml(fmtV6(user.createdAt))}</p>
        </article>
        <article class="profile-card">
          <h3>权限列表</h3>
          <div class="permission-list">${permissionTagsV6(user.permissions)}</div>
        </article>
      </section>
      <section class="dashboard-table v6-table">
        <h3>我的工作数据</h3>
        <table>
          <thead><tr>${DASHBOARD_METRICS_V6.map(([, label]) => `<th>${label}</th>`).join('')}<th>最近操作时间</th></tr></thead>
          <tbody><tr>${DASHBOARD_METRICS_V6.map(([key]) => `<td>${Number(metrics[key] || 0)}</td>`).join('')}<td>${escapeHtml(fmtV6(v6ProfileData?.overview?.lastOperationAt || v6ProfileData?.lastOperationAt))}</td></tr></tbody>
        </table>
      </section>
    `;
  }

  function getCurrentUserPhoneV6() {
    return String(currentUser?.phone || currentUser?.phoneMasked || currentUser?.phone_masked || '').replace(/\D/g, '');
  }

  function validatePasswordChangeV6(formData, isFirstChange) {
    const currentPassword = String(formData.get('currentPassword') || '');
    const newPassword = String(formData.get('newPassword') || '');
    const confirmPassword = String(formData.get('confirmPassword') || '');
    const phone = getCurrentUserPhoneV6();
    const weakPasswords = new Set(['12345678', '123456789', '1234567890', 'password', 'password123', 'qwerty123', '11111111', '88888888', 'abcdefg1']);
    if (!currentPassword) return isFirstChange ? '请输入当前临时密码' : '请输入当前密码';
    if (newPassword.length < 8) return '新密码至少需要 8 位';
    if (phone && newPassword === phone) return '新密码不能与手机号相同';
    if (newPassword === currentPassword) return isFirstChange ? '新密码不能与临时密码相同' : '新密码不能与当前密码相同';
    if (newPassword !== confirmPassword) return '两次输入的新密码不一致';
    if (weakPasswords.has(newPassword.toLowerCase())) return '不允许使用明显弱密码';
    return '';
  }

  function passwordChangeFailureMessageV6(error, isFirstChange) {
    const message = String(error?.message || '');
    if (message.includes('当前密码') || message.includes('Current password') || message.includes('INVALID_CREDENTIALS')) {
      return isFirstChange ? '当前临时密码错误' : '当前密码错误';
    }
    if (message.includes('登录状态已失效')) return message;
    if (message.includes('新密码') || message.includes('两次输入') || message.includes('弱密码')) return message;
    return '密码修改失败，请稍后重试';
  }

  function renderProfileFormV6(forceChange = false) {
    const isFirstChange = Boolean(forceChange || currentUser?.mustChangePassword);
    form.dataset.mode = isFirstChange ? 'first-change-password' : 'profile';
    formTitle.textContent = isFirstChange ? '首次登录，请设置新密码' : '个人操作';
    form.innerHTML = `
      ${isFirstChange ? '<p class="account-note">您当前使用的是临时密码。设置新密码后才能进入后台。</p>' : `
        <div class="field"><label for="profileName">姓名</label><input id="profileName" name="name" value="${escapeHtml(currentUser?.name || '')}"></div>
        <button type="submit">保存个人资料</button>
      `}
      <hr>
      <h3 class="form-section-title">${isFirstChange ? '设置新密码' : '账号安全'}</h3>
      ${isFirstChange ? '' : '<p class="muted">修改密码后当前会话会失效，请使用新密码重新登录。</p>'}
      <div class="field"><label for="profileCurrentPassword">${isFirstChange ? '当前临时密码' : '当前密码'}</label><input id="profileCurrentPassword" name="currentPassword" type="password" autocomplete="current-password"></div>
      <div class="field"><label for="profileNewPassword">新密码</label><input id="profileNewPassword" name="newPassword" type="password" autocomplete="new-password"></div>
      <div class="field"><label for="profileConfirmPassword">确认新密码</label><input id="profileConfirmPassword" name="confirmPassword" type="password" autocomplete="new-password"></div>
      <button type="button" data-action="profile-change-password">${isFirstChange ? '确认修改' : '修改密码'}</button>
      ${isFirstChange ? '<button type="button" class="secondary" data-action="logout">退出登录</button>' : ''}
      <p class="form-tip" data-role="password-tip"></p>
    `;
  }

  list.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const action = button.dataset.action;
    if (!action || !action.startsWith('staff-') && !['copy-temp-password', 'close-temp-password'].includes(action)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (action === 'copy-temp-password' && v6OneTimePassword) {
      await navigator.clipboard?.writeText(v6OneTimePassword.temporary_password);
      alert('已复制临时密码');
      return;
    }
    if (action === 'close-temp-password') {
      v6OneTimePassword = null;
      renderAccountsList();
      return;
    }
    const id = Number(button.dataset.id);
    const account = v6StaffAccounts.find((item) => Number(item.account_id) === id);
    if (action === 'staff-edit') {
      openEditor(account);
      return;
    }
    const operationMap = {
      'staff-reset-password': 'reset-password',
      'staff-disable': 'disable',
      'staff-unlock': 'unlock',
      'staff-force-logout': 'force-logout'
    };
    if (!operationMap[action]) return;
    const result = await api(`auth/staff-accounts/${id}/${operationMap[action]}`, { method: 'POST' });
    if (result.account?.temporary_password) v6OneTimePassword = result.account;
    await loadResource('accounts');
  }, true);

  form.addEventListener('click', async (event) => {
    const logoutButton = event.target.closest('button[data-action="logout"]');
    if (logoutButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      try {
        await api('auth/logout', { method: 'POST' });
      } catch (error) {
        // Local logout should still clear the browser state if the session already expired.
      }
      clearAuth('已退出，请重新登录。');
      return;
    }
    const button = event.target.closest('button[data-action="profile-change-password"]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const formData = new FormData(form);
    const isFirstChange = form.dataset.mode === 'first-change-password';
    const tip = form.querySelector('[data-role="password-tip"]');
    const validation = validatePasswordChangeV6(formData, isFirstChange);
    if (validation) {
      if (tip) tip.textContent = validation;
      return;
    }
    button.disabled = true;
    try {
      await api('auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: formData.get('currentPassword'),
          newPassword: formData.get('newPassword'),
          confirmPassword: formData.get('confirmPassword')
        })
      });
      clearAuth('密码修改成功，请使用新密码重新登录。');
    } catch (error) {
      if (tip) tip.textContent = passwordChangeFailureMessageV6(error, isFirstChange);
    } finally {
      button.disabled = false;
    }
  }, true);

  form.addEventListener('submit', async (event) => {
    if (!['staff-account', 'profile', 'first-change-password'].includes(form.dataset.mode)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const formData = new FormData(form);
    if (form.dataset.mode === 'staff-account') {
      const payload = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        role: formData.get('role'),
        organization_type: formData.get('organization_type'),
        store_id: formData.get('store_id'),
        account_status: formData.get('account_status'),
        permissions: formData.getAll('permissions')
      };
      const path = currentRecord ? `auth/staff-accounts/${currentRecord.account_id}` : 'auth/staff-accounts';
      const result = await api(path, {
        method: currentRecord ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      if (result.account?.temporary_password) v6OneTimePassword = result.account;
      await loadResource('accounts');
      return;
    }
    if (form.dataset.mode === 'profile') {
      const result = await api('auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: formData.get('name') })
      });
      currentUser = result.user;
      applyAuthShell();
      await loadResource('profile');
    }
  }, true);

  accountMenuBtn?.addEventListener('click', (event) => {
    event.stopPropagation();
    setAccountMenuOpenV7(accountDropdown?.hidden !== false);
  });

  accountDropdown?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-shell-action]');
    if (!button) return;
    event.preventDefault();
    const action = button.dataset.shellAction;
    if (action === 'profile') openProfileDrawer();
    if (action === 'password') openPasswordEntryV7();
    if (action === 'logout') logoutV7();
  });

  sidebarProfileBtn?.addEventListener('click', openProfileDrawer);
  sidebarLogoutBtn?.addEventListener('click', logoutV7);

  mobileNavToggle?.addEventListener('click', () => {
    document.body.classList.toggle('nav-open');
  });

  document.querySelector('.tabs')?.addEventListener('click', () => {
    document.body.classList.remove('nav-open');
  }, true);

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.account-menu')) setAccountMenuOpenV7(false);
  });

  new MutationObserver(syncShellChromeV7).observe(sectionTitle, { childList: true, characterData: true, subtree: true });
  new MutationObserver(syncShellChromeV7).observe(sectionDesc, { childList: true, characterData: true, subtree: true });

  setupV6Shell();
  if (currentUser) {
    applyAuthShell();
    if (currentUser.mustChangePassword && getRouteFromHash() !== 'change-password') {
      setRoute('change-password');
    }
  }
  syncShellChromeV7();
})();
