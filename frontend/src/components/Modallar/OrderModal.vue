<template>
  <div class="modal-wrapper">
    <div class="modal">
      <h2>Buyurtmani tahrirlash</h2>
      <form @submit.prevent="saveOrder">
        <div class="form-row">
          <input v-model="localOrder.orderCode" placeholder="Buyurtma raqami" />
          <input v-model="localOrder.userCode" placeholder="Foydalanuvchi kodi" />
        </div>
        <div class="form-row">
          <input v-model="localOrder.phone" placeholder="Telefon raqam" />
          <input v-model="localOrder.email" placeholder="Email manzili" />
        </div>
        <div class="form-row">
          <input v-model.number="localOrder.miqdor" placeholder="Umumiy miqdor" type="number" />
          <input v-model.number="localOrder.receivedAmount" placeholder="Qabul qilingan miqdor" type="number" />
        </div>
        <div class="form-row">
          <input v-model="localOrder.nameUz" placeholder="Mahsulot nomi (UZ)" />
          <input v-model="localOrder.nameRu" placeholder="Mahsulot nomi (RU)" />
        </div>
        <div class="form-row">
          <input v-model="localOrder.nameZh" placeholder="Mahsulot nomi (ZH)" />
          <input v-model="localOrder.warehouseZh" placeholder="Ombor nomi (ZH)" />
        </div>
        <div class="form-row">
          <input v-model="localOrder.warehouseRu" placeholder="Ombor nomi (RU)" />
          <input v-model="localOrder.warehouseUz" placeholder="Ombor nomi (UZ)" />
        </div>
        <div class="form-row">
          <input v-model.number="localOrder.weight" placeholder="Vazni (kg)" type="number" />
          <input v-model.number="localOrder.volume" placeholder="Hajmi (m³)" type="number" />
        </div>
        <div class="form-row">
          <input v-model.number="localOrder.density" placeholder="Zichlik (kg/m³)" type="number" />
          <input v-model.number="localOrder.price" placeholder="Yetkazib berish narxi" type="number" />
        </div>
        <div class="form-row">
          <select v-model="localOrder.warehouse">
            <option disabled value="">Ombor tanlang</option>
            <option>Yiwu</option>
            <option>Foshan</option>
            <option>Qashqar</option>
            <option>Hargos</option>
          </select>
          <select v-model="localOrder.status">
            <option disabled value="">Holat tanlang</option>
            <option>Kutilmoqda</option>
            <option>Yarim keldi</option>
            <option>To‘liq keldi</option>
            <option>Yuborildi</option>
            <option>Xitoydan chiqqan</option>
            <option>O‘zbekistonga kirgan</option>
            <option>Toshkent ombori</option>
            <option>Bojxona rasmiylashtiruvi</option>
            <option>Yetkazib berilgan</option>
          </select>
        </div>
        <div class="form-row bnt">
          <button type="submit" class="btn btn-primary" @click="$emit('close')">Saqlash</button>
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Bekor qilish</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    order: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      localOrder: { ...this.order }, // order propdan lokal nusxa
    };
  },
  watch: {
    order: {
      handler(newVal) {
        this.localOrder = { ...newVal };
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    saveOrder() {
      this.$emit("save", this.localOrder);
    },
  },
};
</script>

<style scoped>
.modal-wrapper {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  width: 700px;
  max-height: 90%;
  overflow-y: auto;
  padding: 20px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

input, select {
  flex: 1;
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 10px;
  transition: border-color 0.3s ease;
}

input:focus, select:focus {
  outline: none;
  border-color: #1d92ff;
}

.btn-primary {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 14px;
  cursor: pointer;
}

.btn-secondary {
  margin-left: 10px;
  padding: 10px 20px;
  background-color: rgb(179, 179, 179);
  border: none;
  border-radius: 14px;
  cursor: pointer;
}

.bnt {
  justify-content: flex-end;
  display: flex;
}

form {
  width: 100%;
}

.modal-wrapper {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  width: 700px;
  max-height: 90%;
  margin: 100px 600px;
  overflow-y: auto;
  height: 700px;
  padding: 20px;
  box-shadow: 0 0 20px rgba(0,0,0,0.2);
}
.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}
input, select {
  flex: 1;
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 10px;
}
input:focus, select:focus {
  outline: none;
  border-color: #1d92ff;
}
.btn-primary {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 14px;
  cursor: pointer;
}
.btn-secondary {
  margin-left: 10px;
  padding: 10px 20px;
  background-color: rgb(179, 179, 179);
  border: none;
  border-radius: 14px;
  cursor: pointer;
}
.bnt {
  justify-content: flex-end;
}
form {
  width: 100%;
}
</style>
