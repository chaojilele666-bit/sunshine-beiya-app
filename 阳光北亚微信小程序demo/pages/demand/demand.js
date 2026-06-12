Page({
  data: {
    serviceTypes: ['育儿嫂', '月嫂', '住家保姆', '小时工', '老人陪护'],
    serviceIndex: 0,
    serviceText: '育儿嫂',
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
    const { form, serviceTypes, serviceIndex } = this.data;
    if (!form.name || !form.phone || !form.address || !form.startTime) {
      wx.showToast({
        title: '请完善必填信息',
        icon: 'none'
      });
      return;
    }

    getApp().addDemand(Object.assign({
      customerName: form.name,
      serviceType: serviceTypes[serviceIndex],
      area: form.address,
      showToAyi: true
    }, form));

    wx.showToast({
      title: '需求已提交',
      icon: 'success'
    });

    setTimeout(() => {
      wx.switchTab({
        url: '/pages/mine/mine'
      });
    }, 700);
  }
});
