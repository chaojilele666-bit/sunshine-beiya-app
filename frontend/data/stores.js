const stores = [
  {
    id: 1,
    image: '',
    name: '东城安定门服务点',
    district: '东城区',
    address: '北京市东城区安定门外东河沿乙六号楼三层',
    area: '东城、西城、朝阳',
    tags: ['家政', '母婴', '养老', '保洁'],
    phone: '18611607087',
    canStay: true,
    visible: true,
    intro: '演示数据：东城安定门服务点面向东城、西城和朝阳家庭，提供家政、母婴、养老护理和住家服务咨询。',
    businessHours: '09:00-18:00',
    managerName: '杨店长',
    managerTitle: '门店负责人',
    managerImage: '',
    managerIntro: '演示数据：负责门店日常咨询、阿姨资料审核和客户服务跟进。',
    staffCount: 12,
    consultantCount: 4,
    ayiCount: 80,
    teamIntro: '演示数据：团队由服务顾问、资料审核和客户跟进人员组成，重点服务东城及周边家庭。',
    latitude: 39.949,
    longitude: 116.408,
    color: '#d9f1e9'
  },
  {
    id: 2,
    image: '',
    name: '朝阳服务联络点',
    district: '朝阳区',
    address: '演示地址：朝阳区重点服务区域',
    area: '朝阳、通州、顺义',
    tags: ['育儿嫂', '小时工'],
    phone: '18611607087',
    canStay: false,
    color: '#f8e7d6'
  },
  {
    id: 3,
    image: '',
    name: '海淀服务联络点',
    district: '海淀区',
    address: '演示地址：海淀区重点服务区域',
    area: '海淀、昌平、石景山',
    tags: ['月嫂', '育儿嫂'],
    phone: '18611607087',
    canStay: false,
    color: '#e7edff'
  },
  {
    id: 4,
    name: '丰台养老护理服务点',
    district: '丰台区',
    address: '演示地址：丰台区重点服务区域',
    area: '丰台、大兴、房山',
    tags: ['老人陪护', '住家保姆'],
    phone: '18611607087',
    canStay: true,
    color: '#e9f5df'
  },
  {
    id: 5,
    name: '通州家政服务点',
    district: '通州区',
    address: '演示地址：通州区重点服务区域',
    area: '通州、朝阳东部',
    tags: ['保洁', '小时工'],
    phone: '18611607087',
    canStay: false,
    color: '#e8f0f3'
  }
];

module.exports = {
  stores
};
