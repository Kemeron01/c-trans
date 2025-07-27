<template>
  <div class="box">
    <div class="edit_box">
      <button type="button" @click="ortga()" class="btns">Orqaga</button>
      <h1>Lid tafsilotlari</h1>
      <div class="card">
        <i class="bi bi-pencil-square" @click="openModal"></i>
        <table class="table">
          <tbody>
            <tr><td>Buyurtma raqami: <span>{{ orders.order_number }}</span></td></tr>
            <tr><td>Foydalanuvchi kodi: <span>{{ orders.user_ucode }}</span></td></tr>
            <tr><td>Telefon: <span>{{ orders.phone_number }}</span></td></tr>
            <tr><td>Elektron pochta: <span>{{ orders.gmail }}</span></td></tr>
            <tr><td>Umumiy miqdor: <span>{{ orders.weight }}</span></td></tr>
            <tr><td>Qabul qilingan miqdor: <span>{{ orders.received_quantity }}</span></td></tr>
            <tr><td>Name (UZ): <span>{{ orders.nameUz }}</span></td></tr>
            <tr><td>Name (RU): <span>{{ orders.nameUz }}</span></td></tr>
            <tr><td>Name (ZH): <span>{{ orders.nameUz }}</span></td></tr>
            <tr><td>Vazn (kg): <span>{{ orders.weight }}</span></td></tr>
            <tr><td>M³: <span>{{ orders.m3 }}</span></td></tr>
            <tr><td>O'rtacha og'irlik (kg/m³): <span>{{ orders.average_weight_kg }}</span></td></tr>
            <tr><td>Holat: <span>{{ orders.status }}</span></td></tr>
            <tr><td>Yaratilgan sana: <span>{{ orders.createdAt }}</span></td></tr>
            <tr>
              <td>
                <h3>Rasm</h3>
                <div class="multi_image_box">
                  <div
                    class="image_preview"
                    v-for="(img, index) in imageList"
                    :key="img.id"
                  >
                    <img :src="img.url" alt="Rasm" />
                    <button class="remove_btn" @click="removeImage(index)">×</button>
                  </div>
                  <label class="upload_box">
                    <input
                      type="file"
                      multiple
                      @change="handleImageUpload"
                    />
                    <span class="plus">+</span>
                  </label>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <button class="btns" @click="uploadImages">📤 Rasmlarni yuborish</button>
      </div>
    </div>

    <OrderModal
      v-if="showModal"
      :order="modalUser"
      @save="updateOrder"
      @close="showModal = false"
    />
  </div>
</template>
 
<script>
import OrderModal from "@/components/Modallar/OrderModal.vue";
import axios from "axios";
import {useRoute } from 'vue-router'

export default {
  components: {
    OrderModal,
  },
  // mounted(){
  // },
  data() {
    return {
      search: '',
      modalVisible: false,
      editMode: false,
      orders: {},
      showModal: false,
      imageList: [],
      imageUrl: '',
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
        status: 'Bog‘lanilmagan',
      },
    };
  },
  methods: {
    ortga() {
      this.$router.push("/buyurtmalar");
    },
    openModal() {
      this.modalUser = this.orders;
      this.showModal = true;
    },
    removeImage(index) {
      this.imageList.splice(index, 1);
    },
    async handleImageUpload(event) {
      const files = Array.from(event.target.files);
      for (let file of files) {
        const hash = await this.getFileHash(file);
        const exists = this.imageList.some((img) => img.id === hash);
        if (!exists) {
          const url = URL.createObjectURL(file);
          this.imageList.push({ url, file, id: hash });
        }
      }
      event.target.value = ""; // input tozalansin
    },
    getFileHash(file) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const buffer = new Uint8Array(reader.result);
          let hash = 0;
          for (let i = 0; i < buffer.length; i++) {
            hash = (hash * 31 + buffer[i]) % 1000000007;
          }
          resolve(hash);
        };
        reader.readAsArrayBuffer(file);
      });
    },
    async uploadImages() {
      const formData = new FormData();
      this.imageList.forEach((img) => {
        formData.append("images", img.file);
      });

      try {
        const res = await axios.post("http://localhost:3000/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        alert("Rasmlar muvaffaqiyatli yuborildi!");
        console.log(res.data);
      } catch (error) {
        alert("Xatolik yuz berdi");
        console.error(error);
      }
    },
    async getUser(){
      try{
        const router =  useRoute()
    const id = router.params.id
    console.log("api start");
    const token = localStorage.getItem('token')
    const res = await axios.get(`http://89.169.2.238:8002/api/v1/waiting-orders/${id}`,{
      headers:{
        Authorization:` Bearer ${token}`
      },
    });
    this.orders = res.data
    console.log(this.orders,'res');
    } catch{
      console.log('error')
      }
    }
  },
  mounted() {
    this.getUser()
  },
};
</script>

<style scoped>
.box {
  display: flex;
  flex-direction: column;
  padding: 40px;
}
.btns {
  font-size: 16px;
  padding: 8px 12px;
  border-radius: 10px;
  background-color: rgb(224, 224, 224);
  border: none;
  margin: 10px 0;
  cursor: pointer;
}
.edit_box {
  width: 700px;
}
.card {
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
}
.card i {
  float: right;
  font-size: 25px;
  cursor: pointer;
}
td {
  font-size: 17px;
  padding: 12px;
  color: rgb(117, 117, 117);
  display: flex;
  justify-content: space-between;
}
td span {
  color: #000;
}
.multi_image_box {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 10px;
}
.image_preview {
  position: relative;
}
.image_preview img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 10px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
}
.remove_btn {
  position: absolute;
  top: -10px;
  right: -10px;
  background-color: #ff4d4f;
  border: none;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 16px;
}
.upload_box {
  width: 120px;
  height: 120px;
  border: 2px dashed #bbb;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
}
.upload_box:hover {
  border-color: dodgerblue;
}
.upload_box:hover .plus {
  color: dodgerblue;
}
.upload_box input {
  display: none;
}
.plus {
  font-size: 40px;
  color: #aaa;
  user-select: none;
  transition: color 0.3s ease;
}
</style>
