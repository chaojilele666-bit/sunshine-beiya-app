Page({
  data: {
    serviceTypes: ['育儿嫂', '月嫂', '住家保姆', '小时工', '老人陪护'],
    serviceIndex: 0,
    serviceText: '育儿嫂',
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
    const profile = getApp().globalData.ayiProfile;
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
    const { form, serviceTypes, serviceIndex, liveOptions, liveIndex } = this.data;
    if (!form.name || !form.phone || !form.age || !form.experience) {
      wx.showToast({
        title: '请完善必填资料',
        icon: 'none'
      });
      return;
    }

    const profile = Object.assign({}, form, {
      serviceType: serviceTypes[serviceIndex],
      liveType: liveOptions[liveIndex]
    });
    getApp().saveAyiProfile(profile);

    wx.showToast({
      title: '资料已保存',
      icon: 'success'
    });

    setTimeout(() => {
      wx.navigateBack();
    }, 700);
  }
});
