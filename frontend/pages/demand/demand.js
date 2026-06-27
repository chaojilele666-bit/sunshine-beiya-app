Page({
  data: {
    serviceTypes: [],
    serviceIndex: 0,
    serviceText: '请选择服务类型',
    form: {
      name: '',
      phone: '',
      city: '北京',
      address: '',
      startTime: '',
      familyInfo: '',
      budget: '',
      note: ''
    }
  },

  onShow() {
    const app = getApp();
    this.refreshServiceTypes();
    app.loadBackendData().then(() => {
      this.refreshServiceTypes();
    });
  },

  refreshServiceTypes() {
    const app = getApp();
    const previous = this.data.serviceText === '请选择服务类型' ? '' : this.data.serviceText;
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

  updateField(event) {
    const field = event.currentTarget.dataset.field;
    const form = this.data.form;
    form[field] = event.detail.value;
    this.setData({ form });
  },

  submitDemand() {
    const app = getApp();
    if (!app.isLoggedIn()) {
      app.requireLogin().catch(() => {});
      return;
    }
    const { form, serviceTypes, serviceIndex } = this.data;
    const serviceType = serviceTypes[serviceIndex];
    if (!form.name || !form.phone || !form.address || !form.startTime || !serviceType) {
      wx.showToast({
        title: '请完善必填信息',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '提交中'
    });

    app.addDemand(Object.assign({
      customerName: form.name,
      serviceType,
      area: form.address,
      showToAyi: true
    }, form)).then((result) => {
      wx.hideLoading();
      wx.showToast({
        title: '需求已提交',
        icon: 'success'
      });
      setTimeout(() => {
        wx.navigateTo({
          url: `/pages/demand-detail/demand-detail?id=${result.demandId}`
        });
      }, 700);
    }).catch((error) => {
      wx.hideLoading();
      if (error && error.code === 'LOGIN_REQUIRED') return;
      wx.showToast({
        title: '提交失败，请确认后台服务是否可用',
        icon: 'none',
        duration: 3000
      });
    });
  }
});
