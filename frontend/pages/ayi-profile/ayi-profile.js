Page({
  data: {
    serviceTypes: [],
    serviceIndex: 0,
    serviceText: '请选择服务类型',
    liveOptions: ['可住家', '不住家', '均可'],
    liveIndex: 2,
    liveText: '均可',
    form: {
      name: '',
      phone: '',
      age: '',
      hometown: '',
      experience: '',
      salary: '',
      availableTime: '',
      skills: '',
      intro: ''
    }
  },

  onLoad() {
    this.loadProfile();
  },

  onShow() {
    const app = getApp();
    this.refreshServiceTypes();
    app.loadBackendData().then(() => {
      this.refreshServiceTypes();
    });
  },

  loadProfile() {
    const profile = getApp().globalData.ayiProfile;
    this.refreshServiceTypes(profile ? profile.serviceType : '');
    if (!profile) return;

    const serviceIndex = Math.max(0, this.data.serviceTypes.indexOf(profile.serviceType));
    const liveIndex = Math.max(0, this.data.liveOptions.indexOf(profile.liveType));
    this.setData({
      serviceIndex,
      serviceText: this.data.serviceTypes[serviceIndex],
      liveIndex,
      liveText: this.data.liveOptions[liveIndex],
      form: {
        name: profile.name || '',
        phone: profile.phone || '',
        age: profile.age || '',
        hometown: profile.hometown || '',
        experience: profile.experience || '',
        salary: profile.salary || '',
        availableTime: profile.availableTime || '',
        skills: profile.skills || '',
        intro: profile.intro || ''
      }
    });
  },

  refreshServiceTypes(currentValue) {
    const app = getApp();
    const previous = currentValue || (this.data.serviceText === '请选择服务类型' ? '' : this.data.serviceText);
    const serviceTypes = app.getServiceTypeNames(previous);
    const serviceIndex = Math.max(0, serviceTypes.indexOf(previous));
    this.setData({
      serviceTypes,
      serviceIndex,
      serviceText: serviceTypes[serviceIndex] || '请选择服务类型'
    });
  },

  chooseService(event) {
    const serviceIndex = Number(event.detail.value);
    this.setData({
      serviceIndex,
      serviceText: this.data.serviceTypes[serviceIndex]
    });
  },

  chooseLive(event) {
    const liveIndex = Number(event.detail.value);
    this.setData({
      liveIndex,
      liveText: this.data.liveOptions[liveIndex]
    });
  },

  updateField(event) {
    const field = event.currentTarget.dataset.field;
    const form = this.data.form;
    form[field] = event.detail.value;
    this.setData({ form });
  },

  submitProfile() {
    const app = getApp();
    if (!app.isLoggedIn()) {
      app.requireLogin().catch(() => {});
      return;
    }
    const { form, serviceTypes, serviceIndex, liveOptions, liveIndex } = this.data;
    const serviceType = serviceTypes[serviceIndex];
    if (!form.name || !form.phone || !form.age || !form.experience || !serviceType) {
      wx.showToast({
        title: '请完善必填资料',
        icon: 'none'
      });
      return;
    }

    const profile = Object.assign({}, form, {
      serviceType,
      liveType: liveOptions[liveIndex]
    });
    wx.showLoading({ title: '提交中' });
    app.saveAyiProfile(profile).then(() => {
      wx.hideLoading();
      wx.showToast({
        title: '资料已保存',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 700);
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({
        title: '服务暂时不可用，请稍后重试',
        icon: 'none'
      });
    });
  }
});
