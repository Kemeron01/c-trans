<template>
  <div class="box">
    <div class="table__box">
      <section class="header">
        <h2>Foydalanuvchilar</h2>
        <p>Jami foydalanuvchilar: <span>{{ users.length }}</span></p>
        <article>
          <input
            type="text"
            class="filter"
            placeholder="To'liq ismi bo'yicha qidirish"
            v-model="searchQuery"
          />
          <input
            type="text"
            class="filter"
            placeholder="Foydalanuvchi kodi bo'yicha"
            v-model="codeQuery"
          />
          <button class="filter" @click="toggleModal()">
            + Foydalanuvchi qo'shish
          </button>
        </article>
      </section>

      <section class="main">
        <table class="table table-hover">
          <thead>
            <tr>
              <th class="th">#</th>
              <th class="th">To‘liq ismi</th>
              <th class="th">Telefon</th>
              <th class="th">Elektron pochta</th>
              <th class="th">Foydalanuvchi kodi</th>
              <th class="th">Yaratilgan sana</th>
              <th class="th">Amallar</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(user, index) in paginatedUsers"
              :key="user.id"
            >
              <th scope="row">{{ index + 1 + (currentPage - 1) * pageSize }}</th>
              <td>{{ user.name }}</td>
              <td>{{ user.tel }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.userCod }}</td>
              <td>{{ user.create }}</td>
              <td>
                <i class="icon bi bi-eye" @click="UserEdit(user)"></i>
                <i class="icon bi bi-pencil-square" @click="UserEdit(user)"></i>
                <i class="icon bi bi-trash" @click="deleteUser(user.id)"></i>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <div class="footer">
        <p class="left">
          Jami foydalanuvchilar: <span>{{ users.length }}</span>
        </p>
        <div class="pagination" >
          <button class="filter" v-for="page in totalPages" :key="page" @click="changePage(page)">
            {{ page }}
          </button>
        </div>
      </div>
    </div>

    <div class="modal" :class="{ modal_none: modal }" @click.self="toggleModal()">
      <div class="modal_nav">
        <h1>{{ isEditMode ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi qo'shish" }}</h1>
        <p>Foydalanuvchi kodi</p>
        <div class="input_checkbox">
          <input
            type="text"
            :disabled="!isActive"
            ref="userPush"
            v-model="newUser.newCode"
            class="input_number"
          />
          <label class="switch">
            <input type="checkbox" v-model="isActive" />
            <span></span>
          </label>
        </div>
        <p>To'liq ismi</p>
        <div class="name">
          <input type="text" class="input" v-model="newUser.newName" />
        </div>
        <p>Elektron pochta</p>
        <input type="text" v-model="newUser.newEmail" />
        <p>Telefon raqam</p>
        <input type="text" ref="newPhone" v-model="newUser.newPhone" />
        <button type="submit" @click="addUser()">
          {{ isEditMode ? "Saqlash" : "Yaratish" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import IMask from "imask";
import store from "@/store/index.js";
import axios from "axios";

export default {
  data() {
    return {
      users: [],
      modal: true,
      isActive: false,
      isEditMode: false,
      editUserId: null,
      searchQuery: "",
      codeQuery: "",
      currentPage: 1,
      pageSize: 5,
      newUser: {
        newCode: "",
        newName: "",
        newEmail: "",
        newPhone: "",
      },
    };
  },
  mounted() {
    store.state.sideNav="Userlar"
    axios.get("http://localhost:3000/users")
      .then((res) => {
        this.users = res.data.map((user) => ({
          ...user,
          create: user.create || new Date().toISOString().split("T")[0]
        }));
        this.$store.state.count = this.users.length;
      })
      .catch((err) => {
        console.error("Ma'lumot yuklashda xatolik:", err);
      });

    this.$nextTick(() => {
      if (this.$refs.userPush) {
        IMask(this.$refs.userPush, { mask: "CT-00000" });
      }
      if (this.$refs.newPhone) {
        IMask(this.$refs.newPhone, { mask: "+998 (00) 000-00-00" });
      }
    });
  },
  computed: {
    filteredUsers() {
      return this.users.filter((user) => {
        const nameMatch = user.name?.toLowerCase().includes(this.searchQuery.toLowerCase());
        const codeMatch = user.userCod?.toLowerCase().includes(this.codeQuery?.toLowerCase() || "");
        return nameMatch && codeMatch;
      });
    },
    paginatedUsers() {
      const start = (this.currentPage==0 ? this.currentPage==2 : this.currentPage - 1 ) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredUsers.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.filteredUsers.length / this.pageSize);
    }
  },
  methods: {
    toggleModal() {
      this.modal = !this.modal;
    },
    addUser() {
      if (this.isEditMode) {
        const user = this.users.find((u) => u.id === this.editUserId);
        if (user) {
          user.name = this.newUser.newName;
          user.tel = this.newUser.newPhone;
          user.email = this.newUser.newEmail;
          user.userCod = this.newUser.newCode;
        }
      } else {
        const newUser = {
          id: Date.now(),
          name: this.newUser.newName,
          tel: this.newUser.newPhone,
          email: this.newUser.newEmail,
          userCod: this.newUser.newCode,
          create: new Date().toISOString().split("T")[0],
        };
        this.users.push(newUser);
      }
      this.$store.state.count = this.users.length;
      this.resetForm();
      this.toggleModal();
    },
    viewUser(user) {
      this.isEditMode = false;
      this.newUser = {
        newCode: user.userCod,
        newName: user.name,
        newEmail: user.email,
        newPhone: user.tel,
      };
      this.isActive = !!user.userCod;
      this.modal = true;
      this.toggleModal()
    },
    UserEdit(user) {
      this.$router.push('/userEdit')
      
    },
    deleteUser(id) {
      this.users = this.users.filter((user) => user.id !== id);
      this.$store.state.count = this.users.length;
    },
    resetForm() {
      this.newUser = {
        newCode: "",
        newName: "",
        newEmail: "",
        newPhone: "",
      };
      this.isActive = false;
      this.isEditMode = false;
      this.editUserId = null;
    },
    changePage(page) {
      this.currentPage = page;
    }
  },
  watch: {
    isActive() {
      if (!this.isActive) this.newUser.newCode = "";
    },
    searchQuery() {
      this.currentPage = 1;
    },
    codeQuery() {
      this.currentPage = 1;
    }
  },
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

/* Main */
.main {
  border-radius: 10px;
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

/* Footer */

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
/* MODAL */
.modal {
  display: flex;
  justify-content: end;
  left: 0;
  width: 100%;
  background-color: rgba(15, 15, 15, 0.836);
}
.modal_nav {
  left: 400px;
  background: rgb(255, 255, 255);
  padding: 25px;
  justify-content: center;
  width: 33%;
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
  font-size: 23px;
  padding: 10px 20px;
  width: 580px;
}
.modal_nav button {
  width: 580px;
  border-radius: 20px;
  font-size: 20px;
  padding: 10px 0;
  margin-top: 30px;
  background-color: #42a1ff;
}
.modal_nav button:hover {
  background-color: #0080ffe0;
}
.chakk {
  width: 20px !important;
}
.modal_none {
  display: none;
  transition: 0.5s;
}
.input_number {
  width: 500px !important;
}
.input_checkbox {
  display: flex;
  align-items: center;
}
/* checkbox */

.switch {
  position: relative;
  width: 50px;
  height: 30px;
  display: inline-block;
  margin: -20px 0 0 10px;
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
  height: 26px;
  width: 26px;
  left: 1.5px;
  top: 1.5px;
  background: #fff;
  border-radius: 50%;
  transition: 0.3s;
}
.switch input:checked + span {
  background: #4caf50;
}
.switch input:checked + span::before {
  transform: translateX(20px);
}
.pagination button {
  margin-right: 10px;
  height: 37px;
  border-radius: 10px;
  border: none;
  background-color: rgb(247, 247, 247);
  font-size: 1rem;
  padding: 0 12px;
}
.pagination button:hover {
  background-color: #d8d8d8;
  color: #000;
}
</style>
