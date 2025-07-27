<template>
  <div class="box">
    <div class="table_box">
      <section class="header">
        <div class="left">
          <input
            type="text"
            v-model="search"
            class="filter"
            placeholder="Foydalanuvchi kodi bo'yicha"
          />
          <select v-model="statusFilter" class="form-select m-2">
            <option  value="">Barcha holatlar</option>
            <option>Bog'lanilmadi</option>
            <option>Bog'lanildi</option>
          </select>

          <select v-model="warehouseFilter" class="form-select m-2">
            <option  value="">Barcha omborlar</option>
            <option>Yiwu</option>
            <option>Foshan</option>
            <option>Qashqar</option>
            <option>Hargos</option>
          </select>

          <select v-model="orderFilter" @change="orderFilter1" class="form-select m-2">
            <option  value="">Yangi boshida</option>
            <option>Yangi boshidan</option>
            <option>Eski boshidan</option>
          </select>
        </div>
        <div class="right">
          <button class="btn" @click="exportExcel">Excelga export qilish</button>
          <button class="btn" @click="openAddModal">Lid qo'shish</button>
        </div>
      </section>

      <section class="main">
        <table class="table table-hover">
          <thead>
            <tr>
              <th class="th">#</th>
              <th class="th">Telefon</th>
              <th class="th">Elektron pochta</th>
              <th class="th">Foydalanuvchi kodi</th>
              <th class="th">Yaratilgan sana</th>
              <th class="th">Holati</th>
              <th class="th">Amallar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, index) in filteredUsers" :key="user.id">
              <th scope="row">{{ index + 1 }}</th>
              <td>{{ user.phone_number }}</td>
              <td>{{ user.gmail }}</td>
              <td>{{ user.user_ucode }}</td>
              <td>{{ user.createdAt }}</td>
              <td>{{ user.status.translations.uz }}</td>
              <td>
                <i class="icon bi bi-eye" @click="viewUser(user)"></i>
                <i class="icon bi bi-pencil-square" @click="openEditModal(user.user_ucode)"></i>
                <i class="icon bi bi-trash" @click="deleteUser(user)"></i>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="footer">
        <p class="left">
          Jami foydalanuvchilar: <span>{{ filteredUsers.length }}</span>
        </p>
      </section>
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal" :class="{ modal_none: !modalVisible }" @click.self="closeModal">
      <div class="modal_nav left_modal">
        <h1>{{ editMode ? 'Foydalanuvchini tahrirlash' : "Lid qo‘shish" }}</h1>

        <p>Foydalanuvchi kodi</p>
        <input v-model="modalUser.userCod" placeholder="CT-" />

        <p>Telefon</p>
        <input v-model="modalUser.tel" placeholder="Telefon raqam" />

        <p>Elektron pochta</p>
        <input v-model="modalUser.email" placeholder="Email" />

        <p>Nomi (Uz)</p>
        <input v-model="modalUser.nameUz" placeholder="Nomi (Uz)" />

        <p>Nomi (Ru)</p>
        <input v-model="modalUser.nameRu" placeholder="Nomi (Ru)" />

        <p>Nomi (Zh)</p>
        <input v-model="modalUser.nameZh" placeholder="Nomi (Zh)" />

        <p>Vazn (kg)</p>
        <input v-model="modalUser.weight" type="number" step="0.01" placeholder="Vazn (kg)" />

        <p>m3</p>
        <input v-model="modalUser.m3" type="number" step="0.001" placeholder="m3" />

        <p>O'rtacha og'irlik (kg/m³)</p>
        <input v-model="modalUser.density" type="number" step="0.01" placeholder="kg/m³" />

        <p>Narx</p>
        <input v-model="modalUser.price" type="number" step="0.01" placeholder="Narx" />

        <p>Sklad</p>
        <select v-model="modalUser.warehouse" class="form-select mt-2 mb-3">
          <option disabled value="">Skladni tanlang</option>
          <option>Yiwu</option>
          <option>Foshan</option>
          <option>Qashqar</option>
          <option>Hargos</option>
        </select>

        <p>Holat</p>
        <select v-model="modalUser.status" class="form-select mt-2 mb-3">
          <option>Bog‘lanilmagan</option>
          <option>Bog‘lanilgan</option>
        </select>

        <button @click="addLid">{{ editMode ? 'Saqlash' : 'Yaratish' }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import * as XLSX from "xlsx";
import axios from "axios";
import store from "@/store";

export default {
  data() {
    return {
      search: '',
      statusFilter: '',
      warehouseFilter: '',
      orderFilter2: "new",
      orderFilter:'',
      modalVisible: false,
      editMode: false,
      users: [],
      modalUser: {
        userCod: '',
        name: '',
        tel: '',
        email: '',
        nameUz: '',
        nameRu: '',
        nameZh: '',
        weight: '',
        m3: '',
        density: '',
        price: '',
        warehouse: '',
        status: 'Bog‘lanilmagan'
      }
    };
  },
  computed: {
    filteredUsers() {
      let result = this.users.filter(user => {
        const searchMatch = user.user_ucode?.toLowerCase().includes(this.search.toLowerCase());
        const statusMatch = this.statusFilter ? user.status.code === this.statusFilter : true;
        const warehouseMatch = this.warehouseFilter ? user.wharehouseUz === this.warehouseFilter : true;
        return searchMatch && statusMatch && warehouseMatch;
      });

      if (this.orderFilter === 'Yangi boshida') {
        result.sort((a, b) => b.id - a.id);
      } else if (this.orderFilter === 'Eski boshida') {
        result.sort((a, b) => a.id - b.id);
      }

      return result;
    }
  },
  methods: {
    async getUsers() {
  try {
    const token = localStorage.getItem('token');
    
    const params = {
      page: 1,
      limit: 10,
      status: this.statusFilter || undefined,
      wharehouse: this.warehouseFilter || undefined,
      user_ucode: this.search || undefined,
      sort: this.orderFilter === 'Yangi boshidan' ? 'new' : this.orderFilter === 'Eski boshidan' ? 'old' : undefined
    };

    const res = await axios.get('http://89.169.2.238:8002/api/v1/leads', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params
    });

    this.users = res.data.data;
  } catch (error) {
    console.error('APIdan foydalanuvchilarni olishda xatolik:', error);
  }
},
      async addLid(){
        try{
          const token = localStorage.getItem('token');

          const res = await axios.post('http://89.169.2.238:8002/api/v1/leads',{
            user_ucode:this.modalUser.userCod,
            phone_number:this.modalUser.tel,
            gmail:this.modalUser.email,
            weight:this.modalUser.weight,
            m3:this.modalUser.m3,
            // average_weight_kg:this.modalUser.userCod,
            price:this.modalUser.price,
            // status: this.orderFilter,
            nameUz:this.modalUser.nameUz,
            nameRu:this.modalUser.nameRu,
            nameZh:this.modalUser.nameZh,
            wharehouseUz:this.modalUser.warehouse,
            // wharehouseRu:this.modalUser.warehouse,
            // wharehouseZh:this.modalUser.warehouse,
            wharehouse_code:this.modalUser.userCod
          },{
            headers:{
              Authorization:`Bearer ${token}`
            }
          })
          this.closeModal()
        } catch{
          console.log('error');
        }
    },
    openAddModal() {
      this.editMode = false;
      this.modalUser = {
        userCod: '',
        name: '',
        tel: '',
        email: '',
        nameUz: '',
        nameRu: '',
        nameZh: '',
        weight: '',
        m3: '',
        density: '',
        price: '',
        warehouse: '',
        status: 'Bog‘lanilmagan'
      };
      this.modalVisible = true;
    },
    openEditModal(id) {
      this.$router.push(`/lidEdit?id=${id}`);
    },
    closeModal() {
      this.modalVisible = false;
    },
    saveUser() {
      if (!this.modalUser.userCod || !this.modalUser.nameUz) {
        alert("Foydalanuvchi kodi va ismi (UZ) majburiy.");        
      }else{
        console.log('123456');
        this.closeModal();
      }


    },
    deleteUser(user) {
      if (confirm("Rostdan ham o‘chirmoqchimisiz?")) {
        this.users = this.users.filter(u => u.id !== user.id);
      }
    },
    viewUser(user) {
      alert(`Ismi: ${user.name}\nTel: ${user.tel}\nEmail: ${user.email}`);
    },
    // async orderFilter1(){
    //   if(this.orderFilter == "Yangi boshidan"){
    //     this.orderFilter2 = "new"
    //     const users = await axios.get('http://89.169.2.238:8002/api/v1/leads',{
    //       sort:this.orderFilter2
    //     })
    //     console.log(this.orderFilter2,this.orderFilter);
    //   } else if(this.orderFilter=="Eski boshidan"){
    //     this.orderFilter2 = "old"
    //     console.log(this.orderFilter2,this.orderFilter);
    //   }
    // },
    exportExcel() {
      const ws = XLSX.utils.json_to_sheet(this.filteredUsers);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Foydalanuvchilar");
      XLSX.writeFile(wb, "users.xlsx");
    }
  },
  watch: {
  statusFilter: 'getUsers',
  warehouseFilter: 'getUsers',
  search: 'getUsers',
  orderFilter: 'getUsers'
},
  mounted() {
    store.state.sideNav="Lidlar",
    this.getUsers()
  }
};
</script>



<style scoped>
.btn-group{
  margin-bottom: 20px;
}
.modal_nav .btns1{
  /* width: 100%; */
  background-color: rgb(247, 247, 247);
  font-size: 16px;
  display: flex;
  justify-content: space-between;
  padding: 10px 20px;
  align-items: center;
}
.modal_nav .btns1:hover{
  background-color: rgb(247, 247, 247);
  color: #9e9e9e;
}
.dropdown-menu{
  width: 100%;
  border-radius: 10px;
}
.dropdown-item:hover{
  background-color: #1875ff;
}

.left_modal {
  left: 0;
  right: auto;
  animation: slideInLeft 0.3s ease;
}
.modal_nav input{
  border-radius: 10px;
  width: 640px;
  height: 45px;
  margin-bottom: 10px;
  background-color: rgb(247, 247, 247);
  border: none;
  padding: 5px 20px;
  font-size: 15px;
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}
  .box{
    padding: 20px;
    height: 100%;
    display: inline-block;
    
}
.table_box{
    padding: 30px;
    border-radius: 16px;
    background-color: #ffffff;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}
.header{
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    align-items: center;
    width: 100%;
}
.header p{
    font-size: 20px;
    display: flex;
    margin-bottom: 0;
    color:rgb(117, 117, 117);
}
.header p span{
    color: #000;
    margin-left: 5px;
}
article{
    display: flex;
    align-items: center;
}
.filter{
    width: 230px;
    height: 37px;
    border-radius: 10px;
    margin-right: 10px;
    border: none;
    background-color: rgb(247, 247, 247);
    font-size: 1rem;
    padding: 0 10px;
    }
    .btn{
        margin-right: 10px;
        background: rgb(247, 247, 247);
    }
    input{
        outline: none;
    }
input:focus{
    border: 1px solid #1875ff;
}

    /* Main */
    .main{
        border-radius: 10px;
        margin-top: 5px;
    }


    td, th{
        font-size: 18px;
    }
    .th{
        color: rgb(77, 77, 77);
        background: rgb(247, 247, 247);
        padding: 15px;
    }
    td{
        font-weight: 400;
        padding:15px;
    }
    .icon{
        margin-right: 5px;
        cursor: pointer;
        color: rgb(77, 77, 77);
    }
    .icon:hover{
        background-color: rgb(230, 230, 230);
        color:#0d6efd;
    }

    /* Footer */

    .footer{
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .left{
        font-size: 20px;
        display: flex;
        align-items: center;
    }
    .left span{
        color:#0d6efd;
    }
    .right{
        font-size: 10px;
    }
    /* MODAL overlay */
    .modal {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 100vw;
  background-color: rgba(0, 0, 0, 0.5); /* qoramtir fon */
  display: flex;
  justify-content: flex-end;
  z-index: 1000;
}

.modal_nav {
  width: 37%; /* o'ng tomondan 1/4 ekran */
  height: 120%;
  background-color: #fff;
  padding: 30px 25px;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
}

.modal_nav h1 {
  font-size: 26px;
  margin-bottom: 30px;
  font-weight: 600;
}

.modal_nav p {
  font-size: 14px;
  margin-bottom: 6px;
  color: #333;
  font-weight: 500;
}

.modal_nav input[type="text"] {
  border: none;
  border-radius: 20px;
  background-color: #f5f5f5;
  font-size: 16px;
  padding: 12px 16px;
  margin-bottom: 20px;
  width: 100%;
  outline: none;
  transition: border 0.2s ease;
}

.modal_nav input:focus {
  border: 1px solid #007bff;
  background-color: #fff;
}

.modal_nav button {
  width: 100%;
  padding: 12px;
  border-radius: 20px;
  background-color: #42a1ff;
  font-size: 18px;
  color: #000;
  font-weight: 500;
  border: 1px solid #2c8ce5;
  transition: background 0.2s ease;
}

.modal_nav button:hover {
  background-color: #2c8ce5;
  color: #fff;
}

/* Switch (checkbox) style */
.input_checkbox {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.switch {
  position: relative;
  width: 50px;
  height: 26px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch span {
  position: absolute;
  cursor: pointer;
  background: #ccc;
  border-radius: 20px;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  transition: 0.3s;
}

.switch span::before {
  content: "";
  position: absolute;
  height: 22px;
  width: 22px;
  left: 2px;
  top: 2px;
  background: #fff;
  border-radius: 50%;
  transition: 0.3s;
}

.switch input:checked + span {
  background: #4caf50;
}

.switch input:checked + span::before {
  transform: translateX(24px);
}

/* Modal yopish uchun class */
.modal_none {
  display: none;
}

/* Animatsiya chiqishda */
@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0%);
  }
}
.select_btn{
  margin-bottom: 0;
}
.form-select{
  background-color: rgb(247, 247, 247);
}

  </style>
  