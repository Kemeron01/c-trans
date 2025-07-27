<template>
    <div class="box">
      <div class="left">
        <p>{{$store.state.sideNav}}</p>
      </div>
      <div class="right">
        <!-- Tungi rejim tugmasi -->
        <button class="btns1 btn btn-outline">
          <i class="bi bi-moon-stars"></i>
        </button>
  
        <!-- Til tanlash dropdown -->
        <div class="btns1 btn-group btns" role="group">
          <button type="button" class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
            <img :src="selectedFlag" class="language_flag" width="17" height="17" alt="Current flag">
          </button>
          <ul class="dropdown-menu">
            <li>
              <a class="dropdown-item" href="#" @click="selectFlag(china)">
                <img :src="this.china" class="img_flag" width="17" height="17" alt="China Flag"> 中文
              </a>
            </li>
            <li>
              <a class="dropdown-item" href="#" @click="selectFlag(russia)">
                <img :src="russia" class="img_flag" width="17" height="17" alt="Russia Flag"> Russia
              </a>
            </li>
            <li>
              <a class="dropdown-item" href="#" @click="selectFlag(uzb)">
                <img :src="uzb" class="img_flag" width="17" height="17" alt="UZB Flag"> UZB
              </a>
            </li>
          </ul>
        </div>
  
        <!-- Profil tugmasi -->
        <button class="btn btns1 btn-outline">
          <i class="bi bi-person-circle"></i>
        </button>
      </div>
    </div>
  </template>
  
  <script>
  import store from "@/store"
  import china from "@/assets/Icon/china.png"
  import russia from "@/assets/Icon/russia.png"
  import uzb from "@/assets/Icon/united.png"

  export default {
    data() {
      return {
        china,
        russia,
        uzb,
        selectedFlag: uzb
      }
    },
    methods: {
      selectFlag(flagFile) {
        this.selectedFlag = flagFile
      }
    }
  }
  </script>
  
  <style scoped>
  .box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 0 20px;
    border-bottom: 1px solid rgb(214, 214, 214);
  }
  .left p {
    font-size: 20px;
    margin: 0;
  }
  .right {
    display: flex;
    align-items: center;
  }
  .btns1 {
    margin-right: 15px;
    font-size: 20px;
  }
  .dropdown-menu {
    position: absolute;
    background-color: white;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    padding: 5px 0;
    border-radius: 6px;
    left: -100px;
  }
  .language_flag {
    object-fit: cover;
    border-radius: 50%;
  }
  .img_flag {
    margin-right: 5px;
    border-radius: 50%;
  }
  </style>
  