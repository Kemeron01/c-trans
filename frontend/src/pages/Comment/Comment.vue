<template>
    <div class="box">
      <div class="table__box">
        <section class="header">
          <article>
            <input
              type="text"
              class="filter"
              placeholder="Foydalanuvchi kodi bo'yicha"
              v-model="codeQuery"
            />
            <input
              type="text"
              class="filter"
              placeholder="Buyurtma raqami bo'yicha qidirish"
              v-model="orderQuery"
            />
            <button class="filter" @click="sortByNewest = !sortByNewest">
              {{ sortByNewest ? 'Yangi boshidan' : 'Eski boshidan' }}
            </button>
          </article>
        </section>
  
        <section class="main">
          <table class="table table-hover">
            <thead>
              <tr>
                <th class="th">#</th>
                <th class="th">Foydalanuvchi kodi</th>
                <th class="th">Buyurtma raqami</th>
                <th class="th">Reyting</th>
                <th class="th">Yaratilgan sana</th>
                <th class="th">Xabar</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(user, index) in paginatedUsers"
                :key="user.id"
              >
                <th scope="row">{{ index + 1 + (currentPage - 1) * pageSize }}</th>
                <td>{{ user.userCod }}</td>
                <td>{{ user.buyurtmaraqami }}</td>
                <td>{{ user.reyting }}</td>
                <td>{{ user.create }}</td>
                <td>{{ user.xabar }}</td>
              </tr>
            </tbody>
          </table>
        </section>
  
        <div class="footer">
          <p class="left">
            Jami foydalanuvchilar: <span>{{ filteredUsers.length }}</span>
          </p>
          <div class="pagination">
            <button
              class="filter"
              v-for="page in totalPages"
              :key="page"
              @click="changePage(page)"
              :class="{ active: currentPage === page }"
            >
              {{ page }}
            </button>
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
        codeQuery: "",
        orderQuery: "",
        currentPage: 1,
        pageSize: 5,
        sortByNewest: true,
      };
    },
    computed: {
      filteredUsers() {
        return this.users
          .filter((user) => {
            const codeMatch = user.userCod?.toLowerCase().includes(this.codeQuery.toLowerCase());
            const orderMatch = user.buyurtmaraqami?.toLowerCase().includes(this.orderQuery.toLowerCase());
            return codeMatch && orderMatch;
          })
          .sort((a, b) => {
            const dateA = new Date(a.create);
            const dateB = new Date(b.create);
            return this.sortByNewest ? dateB - dateA : dateA - dateB;
          });
      },
      paginatedUsers() {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        return this.filteredUsers.slice(start, end);
      },
      totalPages() {
        return Math.ceil(this.filteredUsers.length / this.pageSize);
      },
    },
    methods: {
      changePage(page) {
        this.currentPage = page;
      },
    },
    watch: {
      codeQuery() {
        this.currentPage = 1;
      },
      orderQuery() {
        this.currentPage = 1;
      },
    },
    mounted() {
      store.state.sideNav='Comment'
      axios
        .get("http://localhost:3000/users")
        .then((res) => {
          this.users = res.data;
        })
        .catch((err) => {
          console.error("Xatolik:", err);
        });
    },
  };
  </script>
  
  <style scoped>
  .box {
    padding: 20px;
    flex-direction: column;
    /* background-color: #fff; */
    height: 100%;
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
  .main {
    border-radius: 10px;
    margin-top: 5px;
  }
  th,
  td {
    font-size: 18px;
    padding: 15px;
  }
  .th {
    background: rgb(247, 247, 247);
    color: rgb(77, 77, 77);
  }
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
  }
  .left {
    font-size: 20px;
  }
  .left span {
    color: #0d6efd;
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
  .pagination button.active,
  .pagination button:hover {
    background-color: #0d6efd;
    color: #fff;
  }
  </style>
  