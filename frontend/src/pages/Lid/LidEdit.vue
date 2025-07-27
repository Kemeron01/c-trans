<template >
    <div class="box">
        <div class="edit_box">
            <button type="button" @click="ortga()" class="btns">Orqaga</button>
                <h1>Lid tafsilotlari</h1>
                <div class="card">
                    <i class="bi bi-pencil-square" @click="modalToggle()"></i>
                    <table class="table">
                      <tbody v-for="user in users" :key="user.id">
                        <tr>
                          <td>Foydalanuvchi kodi: <span>{{ user.userCod }}</span></td>
                        </tr>
                        <tr>
                          <td>Telefon: <span>{{ user.tel }}</span></td>
                        </tr>
                        <tr>
                          <td>Elektron pochta: <span>{{ user.email }}</span></td>
                        </tr>
                        <tr>
                          <td>Name (UZ): <span>{{ user.nameUz }}</span></td>
                        </tr>
                        <tr>
                          <td>Name (RU): <span>{{ user.nameRu }}</span></td>
                        </tr>
                        <tr>
                          <td>Name (ZH): <span>{{ user.nameZh }}</span></td>
                        </tr>
                        <tr>
                          <td>Vazn (kg): <span>{{ user.weight }}</span></td>
                        </tr>
                        <tr>
                          <td>M³: <span>{{ user.m3 }}</span></td>
                        </tr>
                        <tr>
                          <td>O'rtacha og'irlik (kg/m³): <span>{{ user.density }}</span> </td>
                        </tr>
                        <tr>
                          <td>Sklad:  <span>{{ user.warehouse }}</span></td>
                        </tr>
                        <tr>
                          <td>Narx: <span>{{ user.price }}</span></td>
                        </tr>
                        <tr>
                          <td>Yaratilgan sana: <span>{{ user.create }}</span></td>
                        </tr>
                        <tr>
                          <td>Holat: <span>{{ user.status }}</span></td>
                        </tr>

                      </tbody>
                    </table>
                </div>
                <!-- Modal -->
                <div class="modal" :class="{ modal_none: !modalVisible }" @click.self="modalToggle()">
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

        <button @click="modalToggle">{{ editMode ? 'Saqlash' : 'Yaratish' }}</button>
      </div>
    </div>
        </div>
        <div class="plus_box">
            <Buyurtmalar/>
        </div>
    </div>
</template>
<script>
import store from '@/store';
import Buyurtmalar from "../Buyurtmalar/Buyurtmalar.vue";
import axios from "axios";
export default {
    components:{
        Buyurtmalar
    },
    data() {
  return {
    search: '',
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
methods:{
    ortga(){
        this.$router.push("/lids")
    },
    modalToggle(){
      if(this.modalVisible){
        this.modalVisible = !this.modalVisible
        console.log("1");
      }else{
        this.modalVisible = !this.modalVisible
        console.log("2");
      }

    }
},
mounted(){
    axios.get('http://localhost:3000/users')
        .then((res)=>{
            this.users = res.data
        })
}
}
</script>
<style scoped>
    .box{
        display: flex;
        flex-direction: column;
        /* width: 100%; */
        height: 100%;
        padding: 40px;
    }
    .btns{
        font-size: 23px;
        padding: 5px 10px;
        border-radius: 10px;
        border:none;
        background-color: rgb(224, 224, 224);
        margin-bottom: 20px;

    }
    p{
        font-size: 26px;
    }
    .edit_box{
        width: 700px;
    }
    .edit_box h1{
        font-size: 35px;
        margin-bottom: 20px;
    }
    .card{
        padding: 20px;
        border: none;
        border-radius: 15px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
    }
    .card i{
        margin-top: -10px;
        margin-left: 640px;
        font-size: 25px;
    }
    td{
        font-size: 17px;
        padding: 12px;
        color: rgb(117, 117, 117);
        display: flex;
        justify-content: space-between;
    }
    td span{
        color: rgb(0, 0, 0);
    }
    /* modal */

    
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
  height: 130%;
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

.modal_nav input {
  border: none;
  border-radius: 20px;
  background-color: #f5f5f5;
  font-size: 22px;
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
  /* font-size: 22px; */
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