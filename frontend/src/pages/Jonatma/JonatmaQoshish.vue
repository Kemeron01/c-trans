<template>
    <div class="box">
      <!-- JO'NATMA FORMASI VA TANLANGAN BUYURTMALAR -->
      <div class="table__box" style="display: flex; gap: 20px; flex-wrap: wrap;">
        <!-- FORM -->
        <div class="top_left">
          <h2>Jo‘natma yaratish</h2>
  
          <label>Jo'nash sanasi</label>
          <input type="date" v-model="shipment.departureDate" class="input" />
  
          <label>Yetib kelgan sanasi</label>
          <input type="date" v-model="shipment.arrivalDate" class="input" />
  
          <label>Izoh</label>
          <textarea v-model="shipment.comment" class="input" rows="4"></textarea>
  
          <label>Holat</label>
          <select v-model="shipment.status" class="input">
            <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
          </select>
        </div>
  
        <!-- TANLANGAN BUYURTMALAR -->
        <div class="top_right">
          <h3>Tanlangan buyurtmalar</h3>
          <table class="table table-hover">
            <thead>
              <tr>
                <th class="th">#</th>
                <th class="th">Foydalanuvchi kodi</th>
                <th class="th">Buyurtma raqami</th>
                <th class="th">Amal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(order, index) in selectedOrders" :key="order.id">
                <td>{{ index + 1 }}</td>
                <td>{{ order.userCode }}</td>
                <td>{{ order.orderCode }}</td>
                <td>
                  <button class="icon" @click="removeOrder(order)">-</button>
                </td>
              </tr>
              <tr v-if="selectedOrders.length === 0">
                <td colspan="4" class="text-center">Tanlangan buyurtmalar yo‘q</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
  
      <!-- MAVJUD BUYURTMALAR TABLE -->
      <div class="table__box1" >
        <div class="filter__box">
          <div class="filter__left">
            <input type="text"  placeholder="Buyurtma raqami bo‘yicha" v-model="searchOrderNumber" class=" input_edit" />
            <input type="text"  placeholder="Foydalanuvchi kodi bo‘yicha" v-model="searchUserCode" class=" input_edit" />
  
            <select v-model="selectedWarehouse" class="input_edit">
              <option value="">Barcha omborlar</option>
              <option v-for="item in warehouses" :key="item" :value="item">{{ item }}</option>
            </select>
          </div>
        </div>
  
        <section class="main">
          <table class="table table-hover">
            <thead>
              <tr>
                <th class="th">#</th>
                <th class="th">Foydalanuvchi kodi</th>
                <th class="th">Buyurtma raqami</th>
                <th class="th">Amal</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(order, index) in filteredOrders"
                :key="order.id"
                v-show="filteredOrders.length"
              >
                <td>{{ index + 1 }}</td>
                <td>{{ order.userCode }}</td>
                <td>{{ order.orderCode }}</td>
                <td>
                  <button class="icon" @click="addOrder(order)">+</button>
                </td>
              </tr>
              <tr v-if="filteredOrders.length === 0">
                <td colspan="4" class="text-center">Mos keluvchi buyurtmalar yo‘q</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
  
      <!-- SAQLASH TUGMASI -->
      <div style="margin-top: 20px; text-align: right">
        <button class="btn btn-primary" @click="saveShipment">Yaratish</button>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        shipment: {
          departureDate: "",
          arrivalDate: "",
          comment: "",
          status: "Yuborildi",
        },
        statuses: [
          "Kutilmoqda",
          "Yarim keldi",
          "To'liq keldi",
          "Yuborildi",
          "Xitoydan Chiqqan",
          "O'zbekistonga kirgan",
          "Toshkent ombori",
          "Bojxona rasmiylashtiruvi",
          "Yetkazib berilgan",
        ],
        warehouses: ["Yiwu", "Foshan", "Qashqar", "Hargos"],
        selectedWarehouse: "",
        searchOrderNumber: "",
        searchUserCode: "",
        selectedOrders: [],
        orders: [
          // Misol uchun bir nechta tayyor buyurtmalar
          {
            id: 1,
            userCode: "U001",
            orderCode: "B001",
            whereHaus: "Yiwu",
          },
          {
            id: 2,
            userCode: "U002",
            orderCode: "B002",
            whereHaus: "Foshan",
          },
        ],
      };
    },
    computed: {
      filteredOrders() {
        return this.orders.filter((order) => {
          const notSelected = !this.selectedOrders.some((o) => o.id === order.id);
          const matchesSearch =
            (!this.searchOrderNumber || order.orderCode.includes(this.searchOrderNumber)) &&
            (!this.searchUserCode || order.userCode.includes(this.searchUserCode)) &&
            (!this.selectedWarehouse || order.whereHaus === this.selectedWarehouse);
          return notSelected && matchesSearch;
        });
      },
    },
    methods: {
      addOrder(order) {
        this.selectedOrders.push(order);
      },
      removeOrder(order) {
        this.selectedOrders = this.selectedOrders.filter((o) => o.id !== order.id);
      },
      saveShipment() {
        const dataToSave = {
          ...this.shipment,
          orders: this.selectedOrders,
        };
        console.log("Yuboriladigan ma'lumot:", dataToSave);
        alert("Jo‘natma muvaffaqiyatli saqlandi!");
      },
    },
  };
  </script>
  
  <style scoped>
  /* Siz yuborgan style’lar asosida */
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
  .btn{
    width: 100px;
  }
  .input {
    padding: 5px 12px;
    border: none;
    width: 100%;
    border-radius: 8px;
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
    font-weight: bold;
    border: none;
    cursor: pointer;
  }
  .table__box {
    margin-bottom: 20px;
    background-color: none;
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
    background: none;
    border: none;
    font-size: 18px;
    font-weight: bold;
  }
  .icon:hover {
    color: #0d6efd;
  }
  .text-center {
    text-align: center;
    font-style: italic;
    color: #666;
  }



  /* style */
  .input_edit{
    padding: 10px 12px;
    border: none;
    width: 240px;
    border-radius: 8px;
    font-size: 15px;
    background-color: rgb(247, 247, 247);
  }
  .input_edit:focus{
    outline: none;
    border: 1px solid #1d92ff
  }
.table__box1{
    padding: 16px;
    border: 1px solid rgb(233, 233, 233);
    border-radius: 12px;
    background: rgb(255, 255, 255);
    width: 99%;
}
  .top_right{
    padding: 16px;
    border: 1px solid rgb(233, 233, 233);
    border-radius: 12px;
    background: rgb(255, 255, 255);
    width: 33%;

    box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
  }
.btn {
    width: 200px;
}
  .top_left{
    padding: 16px;
    border: 1px solid rgb(233, 233, 233);
    border-radius: 12px;    
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    align-items: start;
    width: 65%;
    background-color: white;
  }
  .top_left h2{
    font-size: 25px;
  }
  .top_left label{
    font-size: 18px;
  }
  label{
    margin: 10px;
    color: rgb(117, 117, 117);
  }
  input, textarea, select{
    width: 100%;
  }
  </style>
  