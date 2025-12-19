<script setup lang="ts">
import { ref, computed } from 'vue'

const proformaRef = ref<HTMLElement>()
import jsPDF from 'jspdf'

// Validation functions
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validateForm = () => {
  if (!formData.value.name.trim()) {
    alert('El nombre es requerido.')
    return false
  }
  if (!validateEmail(formData.value.email)) {
    alert('Correo electrónico inválido.')
    return false
  }
  if (!formData.value.service) {
    alert('Selecciona un tipo de servicio.')
    return false
  }
  if (formData.value.service === '3d-printing' || formData.value.service === 'custom') {
    if (formData.value.length <= 0 || formData.value.width <= 0 || formData.value.height <= 0) {
      alert('Las dimensiones deben ser mayores a 0.')
      return false
    }
    if (!formData.value.material) {
      alert('Selecciona un material.')
      return false
    }
    if (formData.value.quantity <= 0) {
      alert('La cantidad debe ser mayor a 0.')
      return false
    }
    if (formData.value.printingTime < 0) {
      alert('El tiempo de impresión no puede ser negativo.')
      return false
    }
  }
  if (!formData.value.description.trim()) {
    alert('La descripción es requerida.')
    return false
  }
  if (formData.value.useCustomPrice && formData.value.customPrice < 0) {
    alert('El precio personalizado no puede ser negativo.')
    return false
  }
  return true
}

const activeSection = ref<string>('home')

const navigateTo = (section: string) => {
  activeSection.value = section
}

// Form data
const formData = ref({
  name: '',
  email: '',
  service: '',
  description: '',
  length: 0,
  width: 0,
  height: 0,
  material: '',
  quantity: 1,
  printingTime: 0,
  useCustomPrice: false,
  customPrice: 0
})

interface Proforma {
  customerName: string
  serviceType: string
  details: string
  total: number
  unitPrice: number
  date: string
  materialCost: number
  timeCost: number
  baseFee: number
  quantity: number
  volume: number
  printingTime: number
  material: string
}

// Proforma data
const proforma = ref<Proforma>({
  customerName: '',
  serviceType: '',
  details: '',
  total: 0,
  unitPrice: 0,
  date: '',
  materialCost: 0,
  timeCost: 0,
  baseFee: 0,
  quantity: 1,
  volume: 0,
  printingTime: 0,
  material: ''
})

interface Material {
  value: string
  label: string
  costPerCm3: number
  type: string
}

const materials: Material[] = [
  // Filament (cheaper)
  { value: 'pla', label: 'PLA (Filamento)', costPerCm3: 0.05, type: 'filament' },
  { value: 'abs', label: 'ABS (Filamento)', costPerCm3: 0.07, type: 'filament' },
  { value: 'petg', label: 'PETG (Filamento)', costPerCm3: 0.08, type: 'filament' },
  { value: 'tpu', label: 'TPU (Filamento)', costPerCm3: 0.09, type: 'filament' },
  // Resin (more expensive)
  { value: 'standard-resin', label: 'Resina Estándar', costPerCm3: 0.15, type: 'resin' },
  { value: 'tough-resin', label: 'Resina Resistente', costPerCm3: 0.18, type: 'resin' },
  { value: 'flexible-resin', label: 'Resina Flexible', costPerCm3: 0.20, type: 'resin' }
]

const totalPrice = computed(() => {
  if (formData.value.useCustomPrice) {
    return formData.value.customPrice * formData.value.quantity
  }
  if (formData.value.service === '3d-printing' || formData.value.service === 'custom') {
    const volume = formData.value.length * formData.value.width * formData.value.height
    const material = materials.find(m => m.value === formData.value.material)
    const materialCost = material ? volume * material.costPerCm3 : 0
    const timeCost = formData.value.printingTime * 0.25
    const baseFee = 5
    return (materialCost + timeCost + baseFee) * formData.value.quantity
  } else {
    // For services, fixed price or based on description
    return 50 * formData.value.quantity // Example fixed price per unit
  }
})

const unitPrice = computed(() => {
  if (formData.value.useCustomPrice) {
    return formData.value.customPrice
  }
  if (formData.value.service === '3d-printing' || formData.value.service === 'custom') {
    const volume = formData.value.length * formData.value.width * formData.value.height
    const material = materials.find(m => m.value === formData.value.material)
    const materialCost = material ? volume * material.costPerCm3 : 0
    const timeCost = formData.value.printingTime * 0.25
    const baseFee = 5
    return materialCost + timeCost + baseFee
  } else {
    return 50
  }
})

const submitQuote = () => {
  if (!validateForm()) {
    return
  }
  console.log('Form data submitted:', formData.value)
  const volume = formData.value.length * formData.value.width * formData.value.height
  console.log('Calculated volume:', volume)
  const material = materials.find(m => m.value === formData.value.material)
  const materialCost = material ? volume * material.costPerCm3 : 0
  const timeCost = formData.value.printingTime * 0.25
  const baseFee = 5
  const total = totalPrice.value
  console.log('Calculated total:', total)
  proforma.value = {
    customerName: formData.value.name,
    serviceType: formData.value.service,
    details: formData.value.description,
    total: total,
    unitPrice: unitPrice.value,
    date: new Date().toLocaleDateString(),
    materialCost: materialCost * formData.value.quantity,
    timeCost: timeCost * formData.value.quantity,
    baseFee: baseFee * formData.value.quantity,
    quantity: formData.value.quantity,
    volume: volume,
    printingTime: formData.value.printingTime,
    material: material ? material.label : ''
  }
  console.log('Proforma generated:', proforma.value)
  activeSection.value = 'proforma'
}

const generatePDF = () => {
  if (!proformaRef.value) return
  const doc = new jsPDF()
  doc.html(proformaRef.value, {
    callback: (doc) => {
      doc.save('proforma.pdf')
    },
    x: 10,
    y: 10,
    width: 190,
    windowWidth: 800
  })
}
</script>

<template>
  <div id="app">
    <!-- Header / Navegación -->
    <header class="header">
      <div class="container">
        <div class="logo">
          <h1>impr<span class="highlight">3</span>q</h1>
        </div>
        <nav class="nav">
          <button 
            @click="navigateTo('home')" 
            :class="{ active: activeSection === 'home' }"
          >
            Inicio
          </button>
          <button 
            @click="navigateTo('impressions')" 
            :class="{ active: activeSection === 'impressions' }"
          >
            Impresiones 3D
          </button>
          <button
            @click="navigateTo('custom')"
            :class="{ active: activeSection === 'custom' }"
          >
            Keycaps
          </button>
          <button 
            @click="navigateTo('services')" 
            :class="{ active: activeSection === 'services' }"
          >
            Servicios
          </button>
          <button 
            @click="navigateTo('quote')" 
            :class="{ active: activeSection === 'quote' }"
            class="cta-button"
          >
            Cotizar
          </button>
        </nav>
      </div>
    </header>

    <!-- Contenido Principal -->
    <main class="main-content">
      <div class="container">
        <!-- Sección Home -->
        <section v-if="activeSection === 'home'" class="section">
          <div class="hero">
            <h2>Bienvenido a impr3q</h2>
            <p class="subtitle">Tu solución integral en impresión 3D y servicios especializados</p>
            <div class="hero-cards">
              <div class="card">
                <h3>🖨️ Impresiones 3D</h3>
                <p>Transformamos tus ideas en objetos reales con tecnología de impresión 3D de alta calidad</p>
              </div>
              <div class="card">
                <h3>🎨 Objetos Personalizados</h3>
                <p>Diseños únicos adaptados a tus necesidades específicas</p>
              </div>
              <div class="card">
                <h3>🔧 Servicios Técnicos</h3>
                <p>Restauración de laptops y piezas de carro con expertos calificados</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Sección Impresiones 3D -->
        <section v-if="activeSection === 'impressions'" class="section">
          <h2>Impresiones 3D</h2>
          <p>Ofrecemos servicios de impresión 3D de alta calidad para todo tipo de proyectos.</p>
          <div class="service-grid">
            <div class="service-item">
              <h4>Prototipos</h4>
              <p>Ideal para validar diseños antes de producción</p>
            </div>
            <div class="service-item">
              <h4>Piezas de repuesto</h4>
              <p>Fabricación de componentes difíciles de conseguir</p>
            </div>
            <div class="service-item">
              <h4>Figuras y maquetas</h4>
              <p>Detalles precisos para coleccionistas</p>
            </div>
          </div>
        </section>

        <!-- Sección Keycaps para Teclados Mecánicos -->
        <section v-if="activeSection === 'custom'" class="section">
          <h2>Keycaps para Teclados Mecánicos</h2>
          <p>Impresos en resina de alta calidad para personalizar tu teclado mecánico.</p>
          <div class="service-grid">
            <div class="service-item">
              <h4>Diseños Personalizados</h4>
              <p>Keycaps con logos, textos o diseños únicos</p>
            </div>
            <div class="service-item">
              <h4>Colores y Materiales</h4>
              <p>Variedad de colores y acabados en resina</p>
            </div>
            <div class="service-item">
              <h4>Layouts Completos</h4>
              <p>Sets completos para diferentes layouts de teclado</p>
            </div>
          </div>
          <div class="image-gallery">
            <h3>Galería de Ejemplos</h3>
            <div class="gallery-grid">
              <div class="gallery-item">
                <div style="width: 100%; height: 150px; background: #f0f0f0; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: #666;">Imagen próximamente</div>
                <p>Keycap con diseño personalizado</p>
              </div>
              <div class="gallery-item">
                <div style="width: 100%; height: 150px; background: #f0f0f0; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: #666;">Imagen próximamente</div>
                <p>Set completo en resina</p>
              </div>
              <div class="gallery-item">
                <div style="width: 100%; height: 150px; background: #f0f0f0; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: #666;">Imagen próximamente</div>
                <p>Variedad de colores</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Sección Servicios -->
        <section v-if="activeSection === 'services'" class="section">
          <h2>Servicios Técnicos</h2>
          <p>Soluciones profesionales para tus equipos y vehículos.</p>
          <div class="service-grid">
            <div class="service-item">
              <h4>💻 Restauración de Laptops</h4>
              <p>Reparación, limpieza y actualización de componentes</p>
            </div>
            <div class="service-item">
              <h4>🚗 Restauración de Piezas</h4>
              <p>Reparación y fabricación de componentes automotrices</p>
            </div>
            <div class="service-item">
              <h4>🔍 Diagnóstico</h4>
              <p>Evaluación completa de problemas técnicos</p>
            </div>
          </div>
        </section>

        <!-- Sección Cotización -->
        <section v-if="activeSection === 'quote'" class="section">
          <h2>Solicita tu Cotización</h2>
          <form class="quote-form" @submit.prevent="submitQuote">
            <div class="form-group">
              <label for="name">Nombre completo:</label>
              <input type="text" id="name" v-model="formData.name" placeholder="Tu nombre" required>
            </div>

            <div class="form-group">
              <label for="email">Correo electrónico:</label>
              <input type="email" id="email" v-model="formData.email" placeholder="tu@correo.com" required>
            </div>

            <div class="form-group">
              <label for="service">Tipo de servicio:</label>
              <select id="service" v-model="formData.service" required>
                <option value="">Selecciona un servicio</option>
                <option value="3d-printing">Impresión 3D</option>
                <option value="custom">Objeto Personalizado</option>
                <option value="laptop">Restauración de Laptop</option>
                <option value="car-parts">Restauración de Piezas de Carro</option>
              </select>
            </div>

            <!-- Conditional fields for 3D printing and custom -->
            <template v-if="formData.service === '3d-printing' || formData.service === 'custom'">
              <div class="form-group">
                <label for="length">Longitud (cm):</label>
                <input type="number" id="length" v-model.number="formData.length" placeholder="0" min="0" step="0.1" required>
              </div>
              <div class="form-group">
                <label for="width">Ancho (cm):</label>
                <input type="number" id="width" v-model.number="formData.width" placeholder="0" min="0" step="0.1" required>
              </div>
              <div class="form-group">
                <label for="height">Altura (cm):</label>
                <input type="number" id="height" v-model.number="formData.height" placeholder="0" min="0" step="0.1" required>
              </div>
              <div class="form-group">
                <label for="material">Material:</label>
                <select id="material" v-model="formData.material" required>
                  <option value="">Selecciona material</option>
                  <option v-for="mat in materials" :key="mat.value" :value="mat.value">{{ mat.label }}</option>
                </select>
              </div>
              <div class="form-group">
                <label for="quantity">Cantidad:</label>
                <input type="number" id="quantity" v-model.number="formData.quantity" placeholder="1" min="1" required>
              </div>
              <div class="form-group">
                <label for="printingTime">Tiempo de impresión (horas):</label>
                <input type="number" id="printingTime" v-model.number="formData.printingTime" placeholder="0" min="0" step="0.1" required>
              </div>
            </template>

            <div class="form-group">
              <label for="description">Descripción del proyecto:</label>
              <textarea id="description" v-model="formData.description" rows="5" placeholder="Describe tu proyecto o necesidad..." required></textarea>
            </div>

            <div class="form-group">
              <label>
                <input type="checkbox" v-model="formData.useCustomPrice"> Usar precio personalizado (para clientes preestablecidos)
              </label>
            </div>
            <div v-if="formData.useCustomPrice" class="form-group">
              <label for="customPrice">Precio personalizado ($):</label>
              <input type="number" id="customPrice" v-model.number="formData.customPrice" placeholder="0" min="0" step="0.01" required>
            </div>

            <button type="submit" class="submit-button">Generar Proforma</button>
          </form>
        </section>

        <!-- Sección Proforma -->
        <section v-if="activeSection === 'proforma'" class="section">
          <h2>Proforma Generada</h2>
          <div ref="proformaRef" class="proforma">
            <div class="proforma-header">
              <img src="/logos/logo.png" alt="Logo" class="logo-img" onerror="this.style.display='none'">
              <h3>impr3q</h3>
              <p>Nota de Venta / Proforma</p>
              <p><strong>Fecha:</strong> {{ proforma.date }}</p>
            </div>
            <div class="proforma-company">
              <p><strong>Empresa:</strong> impr3q</p>
              <p><strong>Dirección:</strong> [Tu dirección]</p>
              <p><strong>Teléfono:</strong> [Tu teléfono]</p>
              <p><strong>Email:</strong> info@impr3q.com</p>
            </div>
            <div class="proforma-details">
              <p><strong>Cliente:</strong> {{ proforma.customerName }}</p>
              <p><strong>Servicio:</strong> {{ proforma.serviceType }}</p>
              <p><strong>Descripción:</strong> {{ proforma.details }}</p>
              <p><strong>Material:</strong> {{ proforma.material }}</p>
              <p><strong>Cantidad:</strong> {{ proforma.quantity }}</p>
              <p><strong>Precio Unitario:</strong> ${{ proforma.unitPrice.toFixed(2) }}</p>
              <p><strong>Volumen:</strong> {{ proforma.volume.toFixed(2) }} cm³</p>
              <p><strong>Tiempo de Impresión:</strong> {{ proforma.printingTime }} horas</p>
            </div>
            <div class="proforma-breakdown">
              <h4>Desglose de Costos</h4>
              <table class="cost-table">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{{ proforma.material ? proforma.material : 'Servicio' }}</td>
                    <td>{{ proforma.quantity }}</td>
                    <td>${{ proforma.unitPrice.toFixed(2) }}</td>
                    <td>${{ (proforma.unitPrice * proforma.quantity).toFixed(2) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3"><strong>Total Estimado:</strong></td>
                    <td><strong>${{ proforma.total.toFixed(2) }}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div class="proforma-footer">
              <p>Esta proforma es válida por 30 días.</p>
              <p><strong>Condiciones de Pago:</strong> 50% al inicio del pedido y 50% al momento de la entrega.</p>
              <p><strong>Cuenta de Ahorros Banco Pichincha:</strong> 2206228204 a nombre de David Malquin</p>
              <p>Contáctanos por WhatsApp: +593 0995100326</p>
              <p style="font-size: 0.9em; color: #666;">Gracias por su preferencia.</p>
              <button @click="generatePDF" class="submit-button">Generar PDF</button>
              <button @click="navigateTo('quote')" class="submit-button secondary">Nueva Cotización</button>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <p>&copy; 2024 impr3q - Todos los derechos reservados</p>
        <p>Contacto: info@impr3q.com</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
}

/* Header */
.header {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo h1 {
  font-size: 2rem;
  color: #667eea;
  font-weight: bold;
}

.logo .highlight {
  color: #764ba2;
  font-size: 2.5rem;
}

.nav {
  display: flex;
  gap: 1rem;
}

.nav button {
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1rem;
  color: #333;
  border-radius: 5px;
  transition: all 0.3s ease;
}

.nav button:hover {
  background: #f0f0f0;
}

.nav button.active {
  background: #667eea;
  color: white;
}

.cta-button {
  background: #764ba2 !important;
  color: white !important;
}

.cta-button:hover {
  background: #5a3779 !important;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 2rem 0;
}

.section {
  background: white;
  border-radius: 15px;
  padding: 3rem;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section h2 {
  color: #667eea;
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.section p {
  color: #666;
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
}

/* Hero Section */
.hero {
  text-align: center;
}

.subtitle {
  font-size: 1.3rem;
  color: #764ba2;
  margin-bottom: 3rem;
}

.hero-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  border-radius: 10px;
  color: white;
  transition: transform 0.3s ease;
}

.card:hover {
  transform: translateY(-10px);
}

.card h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

/* Service Grid */
.service-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.service-item {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 10px;
  border-left: 4px solid #667eea;
  transition: all 0.3s ease;
}

.service-item:hover {
  transform: translateX(10px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
}

.service-item h4 {
  color: #667eea;
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
}

/* Image Gallery */
.image-gallery {
  margin-top: 3rem;
}

.image-gallery h3 {
  color: #667eea;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.gallery-item {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 10px;
  text-align: center;
}

.gallery-item img {
  max-width: 100%;
  height: auto;
  border-radius: 5px;
  margin-bottom: 0.5rem;
}

.gallery-item p {
  color: #666;
  font-size: 0.9rem;
}

/* Quote Form */
.quote-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  color: #333;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 5px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.submit-button {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.submit-button:hover {
  transform: scale(1.05);
}

/* Proforma */
.proforma {
  max-width: 600px;
  margin: 0 auto;
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 10px;
  border: 2px solid #667eea;
}

.proforma-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-img {
  max-width: 150px;
  height: auto;
  margin-bottom: 1rem;
}

.proforma-header h3 {
  color: #667eea;
  font-size: 2rem;
}

.proforma-company {
  margin-bottom: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 5px;
}

.proforma-company p {
  margin: 0.5rem 0;
}

.proforma-details p {
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.proforma-breakdown {
  margin-top: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 5px;
}

.proforma-breakdown h4 {
  color: #667eea;
  margin-bottom: 1rem;
}

.cost-table {
  width: 100%;
  border-collapse: collapse;
}

.cost-table th, .cost-table td {
  border: 1px solid #ddd;
  padding: 0.5rem;
  text-align: left;
}

.cost-table th {
  background-color: #f2f2f2;
  color: #333;
}

.cost-table tfoot td {
  font-weight: bold;
}

.proforma-footer {
  margin-top: 2rem;
  text-align: center;
}

.secondary {
  background: #6c757d !important;
  margin-left: 1rem;
}

.secondary:hover {
  background: #5a6268 !important;
}

/* Footer */
.footer {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2rem 0;
  text-align: center;
  margin-top: 2rem;
}

.footer p {
  margin: 0.5rem 0;
}

/* Responsive */
@media (max-width: 768px) {
  .nav {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .nav button {
    font-size: 0.9rem;
    padding: 0.4rem 0.8rem;
  }
  
  .section {
    padding: 2rem 1rem;
  }
  
  .section h2 {
    font-size: 2rem;
  }
}
</style>