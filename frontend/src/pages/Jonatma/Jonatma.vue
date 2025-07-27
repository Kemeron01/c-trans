<template>
    <div class="box">
      <div class="table__box">
        <!-- Header section -->
        <section class="header">
          <article>
            <input
              type="text"
              class="filter"
              placeholder="Jo'natma raqami bo'yicha qidirish"
              v-model="searchQuery"
            />
            <div class="btn-group">
              <button class="btn  dropdown-toggle" data-bs-toggle="dropdown">
                Barcha holatlar
              </button>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item">Barchasi</a></li>
                <li><a class="dropdown-item">Yangi</a></li>
                <li><a class="dropdown-item">Yuborilgan</a></li>
              </ul>
            </div>
            <div class="btn-group">
              <button class="btn  dropdown-toggle" data-bs-toggle="dropdown">
                Omborlar
              </button>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item">Barchasi</a></li>
                <li><a class="dropdown-item">Toshkent</a></li>
                <li><a class="dropdown-item">Farg'ona</a></li>
              </ul>
            </div>
            <div class="btn-group">
              <button class="btn  dropdown-toggle" data-bs-toggle="dropdown">
                Saralash
              </button>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item">Yangi boshidan</a></li>
                <li><a class="dropdown-item">Eski boshidan</a></li>
              </ul>
            </div>
            <button class="btn " @click="buyurtmaQoshish()">
              + Jo'natma qo'shish
            </button>
          </article>
        </section>
  
        <!-- Table section -->
        <section class="main">
          <table class="table table-hover">
            <thead>
              <tr>
                <th class="th">#</th>
                <th class="th">Jo'natma raqami</th>
                <th class="th">Holati</th>
                <th class="th">Yaratilgan sana</th>
                <th class="th">Amallar</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in filteredShipments" :key="item.id">
                <td>{{ index + 1 }}</td>
                <td>{{ item.number }}</td>
                <td>{{ item.status }}</td>
                <td>{{ item.date }}</td>
                <td>
                  <i class="icon bi bi-eye" @click="buyurtmaQoshish(item)"></i>
                  <i class="icon bi bi-pencil-square" @click="buyurtmaQoshish(item)"></i>
                  <i class="icon bi bi-trash" @click="deleteItem(item.id)"></i>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
  
        <!-- Footer section -->
        <div class="footer">
          <p class="left">Jami jo'natmalar: <span>{{ shipments.length }}</span></p>
          <button class="right">1 2 3...</button>
        </div>
  
        <!-- Modal view/edit -->
        <div class="modal" :class="{ modal_none: isModalHidden }" @click.self="toggleModal()">
          <div class="modal_nav">
            <h1>{{ isEditing ? 'Jo\'natmani tahrirlash' : 'Yangi jo\'natma qo\'shish' }}</h1>
            <p>Jo'natma raqami</p>
            <input v-model="modalData.number" type="text" />
            <p>Holati</p>
            <input v-model="modalData.status" type="text" />
            <p>Yaratilgan sana</p>
            <input v-model="modalData.date" type="date" />
            <button @click="saveItem">Saqlash</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
import store from '@/store';

  export default {
    data() {
      return {
        shipments: [
          { id: 1, number: 'JN-001', status: 'Yangi', date: '2025-07-15' },
          { id: 2, number: 'JN-002', status: 'Yuborilgan', date: '2025-07-14' },
        ],
        searchQuery: '',
        isModalHidden: true,
        isEditing: false,
        modalData: {
          id: null,
          number: '',
          status: '',
          date: ''
        }
      };
    },
    mounted() {
      store.state.sideNav="Jo'natmalar"
    },
    computed: {
      filteredShipments() {
        return this.shipments.filter(item =>
          item.number.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      }
    },
    methods: {
      buyurtmaQoshish(){
        this.$router.push('/jonatmaQoshish')
      },
      toggleModal() {
        this.isModalHidden = !this.isModalHidden;
        if (this.isModalHidden) this.resetModal();
      },
      viewItem(item) {
        this.modalData = { ...item };
        this.isEditing = false;
        this.toggleModal();
      },
      editItem(item) {
        this.modalData = { ...item };
        this.isEditing = true;
        this.toggleModal();
      },
      saveItem() {
        if (this.isEditing) {
          const idx = this.shipments.findIndex(s => s.id === this.modalData.id);
          if (idx !== -1) this.shipments.splice(idx, 1, { ...this.modalData });
        } else {
          this.shipments.push({
            ...this.modalData,
            id: Date.now(),
          });
        }
        this.toggleModal();
      },
      deleteItem(id) {
        this.shipments = this.shipments.filter(item => item.id !== id);
      },
      resetModal() {
        this.modalData = { id: null, number: '', status: '', date: '' };
        this.isEditing = false;
      }
    }
  };
  </script>
  
  <style scoped>
  .box {
    position: relative;
    height: 100%;
    padding: 20px;
    flex-direction: column;
  }
  
  .table__box {
    border: 1px solid rgb(255, 255, 255);
    border-radius: 12px;
    padding: 16px;
    background-color: white;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    height: 70px;
    align-items: center;
    width: 100%;
  }
  
  .header p {
    font-size: 20px;
    display: flex;
    margin-bottom: 0;
    color: rgb(117, 117, 117);
  }
  
  .header p span {
    color: #000;
    margin-left: 5px;
  }
  
  article {
    display: flex;
    align-items: center;
  }
  
  article .filter {
    width: 270px;
    height: 37px;
    border-radius: 10px;
    margin-right: 10px;
    border: none;
    background-color: rgb(247, 247, 247);
    font-size: 1rem;
    padding: 0 10px;
  }
  
  .btn {
    margin-right: 10px;
    background-color: rgb(247, 247, 247);
  }
  
  .main {
    border-radius: 10px;
    margin-top: 5px;
  }
  
  th, td {
    font-size: 18px;
    padding: 15px;
  }
  
  .th {
    background: rgb(247, 247, 247);
    color: rgb(77, 77, 77);
  }
  
  td {
    font-weight: 400;
  }
  
  .icon {
    margin-right: 5px;
    cursor: pointer;
    color: rgb(77, 77, 77);
  }
  
  .icon:hover {
    background-color: rgb(230, 230, 230);
    color: #0d6efd;
  }
  
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .left {
    font-size: 20px;
  }
  
  .left span {
    color: #0d6efd;
  }
  
  .right {
    font-size: 20px;
  }
  
  .modal {
    display: flex;
    justify-content: end;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(15, 15, 15, 0.836);
    z-index: 1000;
  }
  
  .modal_nav {
    width: 33%;
    background: white;
    padding: 25px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }
  
  .modal_nav h1 {
    font-size: 30px;
    margin-bottom: 20px;
  }
  
  .modal_nav p {
    font-size: 16px;
    margin: 0 0 6px 6px;
    font-weight: 400;
  }
  
  .modal_nav input {
    border-radius: 20px;
    border: none;
    background-color: rgb(247, 247, 247);
    margin-bottom: 20px;
    font-size: 18px;
    padding: 10px 20px;
    width: 100%;
  }
  
  .modal_nav button {
    border-radius: 20px;
    font-size: 20px;
    padding: 10px 0;
    margin-top: 20px;
    background-color: #42a1ff;
    color: white;
    border: none;
  }
  
  .modal_nav button:hover {
    background-color: #0080ffe0;
  }
  
  .modal_none {
    display: none;
  }
  </style>