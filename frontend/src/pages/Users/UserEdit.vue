<template>
  <div class="box_target p-4 grid grid-cols-1 md:grid-cols-2 gap-5 box">
    <button class="btn1" @click="ortga()"><- ortga</button>
    <!-- Foydalanuvchi tahrirlash -->
    <div class="box">
      <div class="top_left bg-white p-4 rounded shadow">
      <h2 class="text-xl font-bold mb-4">Foydalanuvchini tahrirlash</h2>
      <form @submit.prevent="saveUser">
        <div class="row">
          <label>To‘liq ismi</label>
          <input v-model="user.name" type="text" class="form-input" />
        </div>
        <div class="row">
          <label>Foydalanuvchi kodi</label>
          <input v-model="user.code" type="text" class="form-input" disabled />
        </div>
        <div class="row">
          <label>Telefon</label>
          <input v-model="user.phone" type="text" class="form-input" />
        </div>
        <div class="row">
          <label>Email</label>
          <input v-model="user.email" type="email" class="form-input" />
        </div>
        <button type="submit" class="btn btn-primary mt-2">Saqlash</button>
      </form>
    </div>

    <!-- Buyurtmalar jadvali -->
    <div class="top_right bg-white p-4 rounded shadow">
      <h2 class="text-xl font-bold mb-4">Kutilayotgan buyurtmalar</h2>

      <div class="right_input flex gap-2 mb-2">
        <input v-model="search" type="text" placeholder="Buyurtma raqami bo‘yicha qidirish" class="form-input" />
        <select v-model="filterStatus" class="form-select">
          <option value="">Barcha holatlar</option>
          <option value="pending">Kutilmoqda</option>
          <option value="done">Bajarildi</option>
        </select>
        <select v-model="sortByDate" class="form-select">
          <option value="">Saralash yo‘q</option>
          <option value="new">Yangi boshidan</option>
          <option value="old">Eski boshidan</option>
        </select>
      </div>

      <table class="w-full table-auto border">
        <thead>
          <tr>
            <th>#</th>
            <th>Buyurtma raqami</th>
            <th>Holat</th>
            <th>Umumiy miqdor</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredOrders.length === 0">
            <td colspan="4" class="text-center">Hech qanday buyurtma topilmadi</td>
          </tr>
          <tr v-for="(order, index) in filteredOrders" :key="order.id">
            <td>{{ index + 1 }}</td>
            <td>{{ order.orderNumber }}</td>
            <td>{{ order.status }}</td>
            <td>{{ order.total }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      user: {
        id: null,
        name: "",
        code: "",
        phone: "",
        email: ""
      },
      orders: [],
      search: "",
      filterStatus: "",
      sortByDate: ""
    };
  },
  computed: {
    filteredOrders() {
      let filtered = this.orders.filter(order => {
        const matchSearch = order.orderNumber.includes(this.search);
        const matchStatus = this.filterStatus ? order.status === this.filterStatus : true;
        return matchSearch && matchStatus;
      });

      if (this.sortByDate === "new") {
        filtered.sort((a, b) => new Date(b.create) - new Date(a.create));
      } else if (this.sortByDate === "old") {
        filtered.sort((a, b) => new Date(a.create) - new Date(b.create));
      }

      return filtered;
    }
  },
  created() {
    this.loadUser();
    this.loadOrders();
  },
  methods: {
    ortga(){
      this.$router.push('/users')
    },
    loadUser() {
      axios.get("http://localhost:3000/users/1")
        .then(res => {
          this.user = res.data;
        })
        .catch(err => {
          console.error("Foydalanuvchini yuklashda xatolik:", err);
        });
    },
    loadOrders() {
      axios.get("http://localhost:3000/orders?userId=1")
        .then(res => {
          this.orders = res.data.map(order => ({
            ...order,
            create: order.create || new Date().toISOString() // agar yo‘q bo‘lsa vaqt qo‘shib qo‘yamiz
          }));
        })
        .catch(err => {
          console.error("Buyurtmalarni yuklashda xatolik:", err);
        });
    },
    saveUser() {
      axios.put(`http://localhost:3000/users/${this.user.id}`, this.user)
        .then(() => {
          alert("Foydalanuvchi saqlandi!");
        })
        .catch(err => {
          console.error("Saqlashda xatolik:", err);
        });
    }
  }
};
</script>

<style scoped>
.box_target{
  display: flex;
  flex-direction: column;
  align-items: start;
}
.box {
  display: flex;
  gap: 60px;
  height: 100%;
  width: 100%;
  padding: 0 40px;
}
.form-input,
.form-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
}
.btn-primary {
  background-color: #2563eb;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
}
form label,
form input {
  font-size: 16px;
}
.top_left, .top_right{
  width: 100%;
  height: 67%;
}
.row {
  margin-bottom: 1rem;
}
.row label,
.row input {
  display: block;
  margin-bottom: 0.5rem;
}
.right_input input, .right_input select{
  font-size: 16px;
  margin-bottom: 10px;
}
.btn1{
  padding: 10px;
  font-size: 20px;
  border: none;
  border-radius: 10px;
  background-color: rgb(219, 219, 219);
}
th,tr{
  font-size: 26px;
  /* width: 100%; */
}
</style>
