<template>
  <div class="box">
    <div class="table_box">
      <section class="header">
        <h2>Administratorlar</h2>
        <p>Jami foydalanuvchilar:<span>{{ users.length }}</span></p>
        <button class="btn" @click="openModal(null, 'create')">+ Yangi administrator qo'shish</button>
      </section>

      <section class="main">
        <table class="table table-hover">
          <thead>
            <tr>
              <th class="th">#</th>
              <th class="th">Foydalanuvchi nomi</th>
              <th class="th">Telefon</th>
              <th class="th">Roli</th>
              <th class="th">Amallar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, index) in users" :key="user.id">
              <th>{{ index + 1 }}</th>
              <td>{{ user.name }}</td>
              <td>{{ user.tel }}</td>
              <td>{{ user.roli }}</td>
              <td>
                <i class="icon bi bi-eye" @click="openModal(user, 'view')"></i>
                <i class="icon bi bi-pencil-square" @click="openModal(user, 'edit')"></i>
                <i class="icon bi bi-trash" @click="deleteUser(user.id)"></i>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-right">
        <h3 class="modal-title">
          {{ modalMode === 'view' ? 'Administratorni ko’rish' : modalMode === 'edit' ? 'Administratorni tahrirlash' : "Yangi administrator qo'shish" }}
        </h3>

        <label>Foydalanuvchi nomi:</label>
        <input type="text" v-model="modalData.name" class="filter" :disabled="modalMode === 'view'" />

        <label>Elektron pochta:</label>
        <input type="email" v-model="modalData.email" class="filter" :disabled="modalMode === 'view'" />

        <label>Telefon raqami:</label>
        <input type="text" v-model="modalData.tel" class="filter" :disabled="modalMode === 'view'" />

        <label>Parol:</label>
        <input type="password" v-model="modalData.password" class="filter" :disabled="modalMode === 'view'" />

        <label>Roli:</label>
        <select v-model="modalData.roli" class="filter select" :disabled="modalMode === 'view'">
          <option value="">Administrator</option>
          <option value="Call-markazi">Call-markazi</option>
          <option value="Kuzatuvchi">Kuzatuvchi</option>
          <option value="Ombor ishchisi">Ombor ishchisi</option>
        </select>

        <div class="modal-buttons">
          <button v-if="modalMode !== 'view'" class="btn bnt1 btn-success" @click="saveUser">Saqlash</button>
          <button class="btn bnt1 btn-secondary" @click="closeModal">Yopish</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import store from "@/store";
import axios from "axios";

export default {
  data() {
    return {
      users: [],
      showModal: false,
      modalMode: 'create',
      modalData: {
        id: null,
        name: "",
        email: "",
        tel: "",
        password: "",
        roli: ""
      }
    };
  },
  mounted() {
    this.fetchUsers();
    store.state.sideNav='Admins'
  },
  methods: {
    fetchUsers() {
      axios.get("http://localhost:3000/users").then((res) => {
        this.users = res.data;
      });
    },
    openModal(user, mode) {
      this.showModal = true;
      this.modalMode = mode;
      if (user) {
        this.modalData = { ...user };
      } else {
        this.modalData = {
          id: null,
          name: "",
          email: "",
          tel: "",
          password: "",
          roli: ""
        };
      }
    },
    closeModal() {
      this.showModal = false;
    },
    saveUser() {
      const method = this.modalData.id ? axios.put : axios.post;
      const url = this.modalData.id ? `http://localhost:3000/users/${this.modalData.id}` : "http://localhost:3000/users";

      method(url, this.modalData).then(() => {
        this.fetchUsers();
        this.closeModal();
      });
    },
    deleteUser(id) {
      axios.delete(`http://localhost:3000/users/${id}`).then(() => this.fetchUsers());
    }
  }
};
</script>

<style scoped>
.btn {
  background-color: rgb(247, 247, 247);
}

.box {
  display: inline-block;
  padding: 20px;
  height: 100%;
}

.table_box {
  padding: 20px;
  background-color: #fff;
  border-radius: 16px;
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

.main {
  border-radius: 10px;
  margin-top: 5px;
}

td,
th {
  font-size: 18px;
}

.th {
  color: rgb(77, 77, 77);
  background: rgb(247, 247, 247);
  padding: 15px;
}

td {
  font-weight: 400;
  padding: 15px;
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

.modal-overlay {
  position: fixed;
  top: 0;
  right: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: flex-end;
  z-index: 999;
}

.modal-right {
  background: white;
  width: 400px;
  height: 100%;
  padding: 30px;
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-title {
  font-size: 22px;
  margin-bottom: 20px;
}

.modal-right label {
  margin-top: 10px;
  font-weight: 500;
  font-size: 16px;
}
.modal-right input{
  border: none;
  background-color: rgb(247, 247, 247);
  border-radius: 16px;
}
.modal-right input:focus{
  outline: none;
  border: 1px solid #1d92ff;
}

.modal-right .filter {
  margin-top: 5px;
  margin-bottom: 15px;
  padding: 10px;
  font-size: 16px;
  width: 100%;
  background-color: rgb(247, 247, 247);
}

.modal-buttons {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.select{
  color: #000;
  border-radius: 16px;
}
.select:focus{
  outline: none;
  border: 1px solid #1d92ff;
}
.bnt1{
  color: #000;
}
</style>
