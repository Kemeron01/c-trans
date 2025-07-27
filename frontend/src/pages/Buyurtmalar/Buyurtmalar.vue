<template>
  <div class="box">
    <!-- Table va Filter qismi -->
    <div class="table__box">
      <div class="filter__box">
        <div class="filter__left">
          <input type="text" placeholder="Buyurtma raqami bo‘yicha" v-model="searchOrderNumber" class="input" />
          <input type="text" placeholder="Foydalanuvchi kodi bo‘yicha" v-model="searchUserCode" class="input" />

          <select v-model="selectedWarehouse" class="input">
            <option value="">Barcha omborlar</option>
            <option v-for="item in warehouses" :key="item" :value="item">{{ item }}</option>
          </select>

          <select v-model="selectedShipment" class="input">
            <option value="">Barcha jo'natmalar</option>
            <option v-for="item in shipments" :key="item" :value="item">{{ item }}</option>
          </select>

          <select v-model="selectedStatus" class="input">
            <option value="">Barcha holatlar</option>
            <option v-for="item in statuses" :key="item" :value="item">{{ item }}</option>
          </select>

          <select v-model="selectedSort" class="input">
            <option value="">Yangi boshidan</option>
            <option v-for="item in sortOptions" :key="item" :value="item">{{ item }}</option>
          </select>
        </div>
        <div class="filter__right">
          <button @click="openAddModal" class="btn">+ Buyurtma qo‘shish</button>
        </div>
      </div>

      <!-- Table -->
      <section class="main">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>#</th>
              <th>Foydalanuvchi kodi</th>
              <th>Buyurtma raqami</th>
              <th>Umumiy miqdor</th>
              <th>Jo'natmalar</th>
              <th>Yaratilgan sana</th>
              <th>Holat</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(order, index) in paginatedOrders" :key="order.id">
              <td>{{ index + 1 + (currentPage - 1) * pageSize }}</td>
              <td>{{ order.user }}</td>
              <td>{{ order.order_number }}</td>
              <td>{{ order.weight }}</td>
              <td>{{ order.jonatmaCode }}</td>
              <td>{{ order.createdAt }}</td>
              <td><span :class="['status', getStatusClass(order.status)]">{{ order.status }}</span></td>
              <td>
                <i @click="editPage(order.id)" class="icon bi bi-eye"></i>
                <i class="icon bi bi-pencil-square"></i>
                <i @click="deleteOrder(order.id)" class="icon bi bi-trash"></i>
              </td>
            </tr>
            <tr v-if="paginatedOrders.length === 0">
              <td colspan="8" class="text-center">Ma'lumot topilmadi</td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="table__footer">
          <div class="left">Jami buyurtmalar: {{ filteredOrders.length }}</div>
          <div class="right">
            <button @click="prevPage" :disabled="currentPage === 1">Oldingi</button>
            <span>{{ currentPage }}</span>
            <button @click="nextPage" :disabled="currentPage >= totalPages">Keyingi</button>
          </div>
        </div>
      </section>
    </div>

    <!-- Modal -->
    <div class="modal" :class="{ modal_none: !modalVisible }" @click.self="closeModal">
      <div class="modal_nav left_modal">
        <h1>{{ editMode ? 'Foydalanuvchini tahrirlash' : "Buyurtma qo'shish" }}</h1>

        <p>Foydalanuvchi kodi</p>
        <input v-model="addOrder.user_ucode" placeholder="CT-" />

        <select v-model="addOrder.status" >
          <option v-for="user in usersLimit" :key="user.key">{{ user.name }}</option>
        </select>

        <p>Telefon</p>
        <input v-model="addOrder.nummber" placeholder="Telefon raqam" />

        <p>Umumiy miqdor</p>
        <input v-model="addOrder.weight" placeholder="Email" />

        <p>To'liq ismi (Uz)</p>
        <input v-model="addOrder.name" placeholder="Nomi (Uz)" />

        <p>Vazn (kg)</p>
        <input v-model="addOrder.weight1" type="number" step="0.01" placeholder="Vazn (kg)" />

        <p>m3</p>
        <input v-model="addOrder.m3" type="number" step="0.001" placeholder="m3" />

        <p>O'rtacha og'irlik (kg/m³)</p>
        <input v-model="addOrder.density" type="number" step="0.01" placeholder="kg/m³" />

        <p>Yetkazib berish narxi $</p>
        <input v-model="addOrder.price" type="number" step="0.01" placeholder="Narx" />

        <p>Sklad</p>
        <select v-model="addOrder.sklad">
          <option disabled value="">Skladni tanlang</option>
          <option>Yiwu</option>
          <option>Foshan</option>
          <option>Qashqar</option>
          <option>Hargos</option>
        </select>

        <p>Holat</p>
        <select v-model="addOrder.status">
          <option>Kutilmoqda</option>
          <option>Yarim keldi</option>
          <option>To'liq keldi</option>
        </select>

        <button @click="saveUser">{{ editMode ? 'Saqlash' : 'Yaratish' }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import store from "@/store";

export default {
  data() {
    return {
      usersLimit:[{name:'Botir',id:1},
        {
          id:2,
          name:"Hojakbar"
        }],
      searchOrderNumber: "",
      searchUserCode: "",
      selectedWarehouse: "",
      selectedShipment: "",
      selectedStatus: "",
      selectedSort: "",
      warehouses: ["Yiwu", "Foshan", "Qashqar", "Hargos"],
      shipments: ["Yuborildi", "Jo'natilmagan"],
      statuses: ["Kutilmoqda", "Yarim keldi", "To'liq keldi", "Yuborildi", "Xitoydan Chiqqan", "O'zbekistonga kirgan", "Toshkent ombori", "Bojxona rasmiylashtiruvi", "Yetkazib berilgan"],
      sortOptions: ["Yangi birinchidan", "Eski birinchidan"],
      currentPage: 1,
      pageSize: 10,
      orders: [],
      addOrder:{
        code:'',
        nummber:"",
        miqdor:"",
        name:"",
        weight:"",
        m3:"",
        weight1:"",
        price:"",
        holat:"",
        sklad:"",
      },
      modalVisible: false,
      editMode: false,
    };
  },
  computed: {
    filteredOrders() {
      let result = this.orders.filter(order => {
        return (
          (!this.searchOrderNumber || order.orderCode?.includes(this.searchOrderNumber)) &&
          (!this.searchUserCode || order.userCode?.includes(this.searchUserCode)) &&
          (!this.selectedWarehouse || order.whereHaus === this.selectedWarehouse) &&
          (!this.selectedShipment || order.jonatmaCode === this.selectedShipment) &&
          (!this.selectedStatus || order.status === this.selectedStatus)
        );
      });
      if (this.selectedSort === "Eski birinchidan") result = result.slice().reverse();
      return result;
    },
    paginatedOrders() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredOrders.slice(start, start + this.pageSize);
    },
    totalPages() {
      return Math.ceil(this.filteredOrders.length / this.pageSize);
    }
  },
  methods: {
    async addOrders() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Token yo'q. Qayta login qiling.");
      return;
    }

    const data = {
      images: [],
      user_ucode: this.addOrder.user_ucode, // bu bo‘sh bo‘lmasligi kerak!
      phone_number: this.addOrder.nummber || "",
      gmail: "",
      quantity: this.addOrder.miqdor || 0,
      received_quantity: "",
      nameUz: this.addOrder.name || "",
      nameRu: this.addOrder.name || "",
      nameZn: this.addOrder.name || "",
      weight: this.addOrder.weight || 0,
      m3: this.addOrder.m3 || 0,
      average_weight_kg: this.addOrder.weight1 || 0,
      wharehouseUz: this.addOrder.sklad || "",
      wharehouseRu: "",
      wharehouseZh: "",
      wharehouse_code: "",
      delivery_price: this.addOrder.price || 0,
      shipment_id: this.addOrder.shipment_id || "",
      lead_id: this.addOrder.lead_id || "",
      // status: this.modalUser.status || "Kutilmoqda", // enumdan biri bo‘lishi kerak
      partially_arrived: false, // bo‘sh string emas!
      full_arrived: false,      // bo‘sh string emas!
      arrival_date: ""
    };

    // user_ucode bo‘sh bo‘lsa, chiqib ketsin
    if (!data.user_ucode) {
      alert("Foydalanuvchi kodi (user_ucode) kiritilmagan!");
      return;
    }

    // status enum to‘g‘ri bo‘lishi shart
    const validStatuses = [
      "Kutilmoqda",
      "Yarim keldi",
      "To'liq keldi",
      "Yuborildi",
      "Xitoydan Chiqqan",
      "O'zbekistonga kirgan",
      "Toshkent ombori",
      "Bojxona rasmiylashtiruvi",
      "Yetkazib berilgan"
    ];
    // if (!validStatuses.includes(data.status)) {
    //   alert(`Status noto‘g‘ri. Quyidagilardan birini tanlang: ${validStatuses.join(", ")}`);
    //   return;
    // }

    const res = await axios.post(
      'http://89.169.2.238:8002/api/v1/waiting-orders',
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log('Buyurtma muvaffaqiyatli qo‘shildi:', res.data.data);
    this.getUaser()
  } catch (err) {
    console.error("Xatolik:", err.response?.data || err.message);
    alert("Xatolik: " + (err.response?.data?.message || err.message));
  }
},
// async getUser(){
//   try{
//     const token = localStorage.getItem('token')
//   const res = await axios.get('http://89.169.2.238:8002/api/v1/waiting-orders',{
//     headers:{
//       Authorization:`Bearer ${token}`
//     }
//   })
//   console.log(res.data.data,'get res');
//   this.orders = res.data.data
//   }catch{

//   }
// },
    getStatusClass(status) {
      if (status === "Kutilmoqda") return "pending";
      if (["Yarim keldi", "To'liq keldi"].includes(status)) return "completed";
      if (status === "Yuborildi") return "sent";
      return "";
    },
    prevPage() {
      if (this.currentPage > 1) this.currentPage--;
    },
    nextPage() {
      if (this.currentPage < this.totalPages) this.currentPage++;
    },
    deleteOrder(id) {
      axios.delete(`http://localhost:3000/orders/${id}`).then(() => {
        this.orders = this.orders.filter(order => order.id !== id);
      });
    },
    editPage(id) {
      this.$router.push({ name: 'BuyurtmaEdit', params: { id } });
    },
    openAddModal() {
      this.editMode = false;
      this.modalUser = {
        userCode: '', name: '', tel: '', email: '',
        nameUz: '', nameRu: '', nameZh: '', weight: '',
        m3: '', density: '', price: '', warehouse: '',
        status: 'Bog‘lanilmagan'
      };
      this.modalVisible = true;
    },
    closeModal() {
      this.modalVisible = false;
    },
    saveUser() {
      if (!this.addOrder.user_ucode || !this.addOrder.name) {
        alert("Foydalanuvchi kodi va ismi (UZ) majburiy.");
        return;
      }
      this.modalUser.name = this.modalUser.nameUz;
      if (this.editMode) {
        const index = this.orders.findIndex(u => u.id === this.modalUser.id);
        if (index !== -1) {
          this.$set(this.orders, index, { ...this.modalUser });
        }
      } else {
        this.orders.push({
          ...this.modalUser,
          id: Date.now(),
          date: new Date().toISOString().split("T")[0],
        });
      }
      this.addOrders();
      this.closeModal();
    },
    async getUaser(){
      try{
        const token = localStorage.getItem('token')
        const res = await axios.get('http://89.169.2.238:8002/api/v1/waiting-orders',{
          headers: {
            Authorization: `Bearer ${token}`
          }
      });
      this.orders = res.data.data
      }catch{
      }
    }
  },
  mounted() {
    store.state.sideNav = 'Buyurtmalar';
    axios.get(`http://localhost:3000/orders`).then(res => {
      const uniqueOrders = new Map();
      res.data.forEach(order => uniqueOrders.set(order.id, order));
      this.orders = Array.from(uniqueOrders.values());
    });
    // this.orderSelect()
    this.getUaser()
    
  }
};
</script>
<style scoped>
.box {
  padding: 20px;
  display: flex;
  flex-direction: column;
}
.filter__box {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
  align-items: center;
}
.filter__left {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.filter__right {
  flex-shrink: 0;
}
.input, .btn {
  padding: 5px 12px;
  border: none;
  border-radius: 8px;
  width: 200px;
  font-size: 15px;
  background-color: rgb(247, 247, 247);
}
.input:focus {
  outline: none;
  border: 1px solid #1d92ff;
}
.btn-primary {
  background-color: #42a1ff;
  padding: 10px 20px;
  border-radius: 10px;
  color: white;
  text-decoration: none;
  font-weight: bold;
}
.table__box {
  border: 1px solid rgb(255, 255, 255);
  border-radius: 12px;
  padding: 16px;
  background-color: white;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
}
.main {
  margin-top: 10px;
}
.th {
  background: rgb(247, 247, 247);
  padding: 15px;
  font-size: 16px;
  font-weight: 600;
}
th,
td {
  padding: 15px;
  font-size: 14px;
}
.icon {
  margin-right: 5px;
  cursor: pointer;
  color: rgb(77, 77, 77);
}
.icon:hover {
  color: #0d6efd;
}
.status {
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: bold;
  display: inline-block;
}
.pending {
  background-color: #fff3cd;
  color: #856404;
}
.completed {
  background-color: #d4edda;
  color: #155724;
}
.sent{
  background-color: #d7d4ed;
  color: #242866;
}
.canceled {
  background-color: #f8d7da;
  color: #721c24;
}
.table__footer {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}
.text-center {
  text-align: center;
  font-style: italic;
  color: #666;
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
  height: 125%;
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
  font-size: 16px;
  padding: 12px 16px;
  margin-bottom: 20px;
  width: 100%;
  outline: none;
  transition: border 0.2s ease;
  font-size: 16px;
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
.modal_nav select{
  border: none;
  border-radius: 20px;
  background-color: #f5f5f5;
  font-size: 16px;
  padding: 12px 16px;
  margin-bottom: 20px;
  width: 100%;
  outline: none;
  transition: border 0.2s ease;
  font-size: 16px;
}
.select_btn{
  margin-bottom: 0;
}
.form-select{
  background-color: rgb(255, 255, 255);
}

</style>