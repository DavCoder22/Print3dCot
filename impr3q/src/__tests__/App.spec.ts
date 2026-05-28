import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'

beforeAll(() => {
  globalThis.alert = vi.fn()
  globalThis.Image = class {
    constructor() { setTimeout(() => this.onerror?.(), 0) }
    src = ''
    onerror: (() => void) | null = null
  } as any
})

const mockAuth = reactive({
  user: { id: '1', name: 'Test', email: 'test@test.com' },
  loading: false,
  error: '',
  demoMode: true
})

vi.mock('../services/auth', () => ({
  auth: mockAuth,
  checkAuth: vi.fn(() => { mockAuth.loading = false; mockAuth.user = { id: '1', name: 'Test', email: 'test@test.com' } }),
  logout: vi.fn(() => { mockAuth.user = null }),
  login: vi.fn(),
  register: vi.fn()
}))

vi.mock('jspdf', () => ({
  default: class {
    html() { return this }
    save() {}
  }
}))

async function createWrapper() {
  const App = (await import('../App.vue')).default
  const wrapper = mount(App, {
    attachTo: document.body,
    global: {
      stubs: {
        Login: { template: '<div class="login-stub">Login</div>' },
        Register: { template: '<div class="register-stub">Register</div>' }
      }
    }
  })
  for (let i = 0; i < 5; i++) await nextTick()
  return wrapper
}

async function goToQuote(wrapper: VueWrapper) {
  await wrapper.find('button.cta-button').trigger('click')
  await nextTick()
}

async function fillQuoteForm(wrapper: VueWrapper) {
  await wrapper.find('input#name').setValue('María García')
  await wrapper.find('input#email').setValue('maria@test.com')
  await wrapper.find('select#service').setValue('3d-printing')
  await nextTick()
  await wrapper.find('.item-card select').setValue('pla')
  await nextTick()
  await wrapper.find('.item-card input[type="number"]').setValue(30)
  await nextTick()
}

async function submitQuote(wrapper: VueWrapper) {
  await wrapper.find('form.quote-form').trigger('submit')
  for (let i = 0; i < 5; i++) await nextTick()
}

describe('Smoke Tests', () => {
  let wrapper: VueWrapper

  beforeEach(async () => {
    wrapper = await createWrapper()
  })

  it('renderiza la app sin errores', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('muestra el logo IMPR3Q en el header', () => {
    expect(wrapper.html()).toContain('IMPR')
    expect(wrapper.html()).toContain('3')
    expect(wrapper.html()).toContain('Q')
  })

  it('muestra el botón Cotizar en el header', () => {
    const btn = wrapper.find('button.cta-button')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('Cotizar')
  })

  it('muestra el botón Solicitar Cotización en hero', () => {
    const btn = wrapper.find('button.btn-primary')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('Solicitar Cotización')
  })

  it('muestra las 3 features del hero', () => {
    const features = wrapper.findAll('.feature')
    expect(features.length).toBe(3)
    expect(features[0].text()).toContain('Impresión 3D')
  })

  it('muestra el nombre de usuario en el header', () => {
    expect(wrapper.text()).toContain('Test')
  })

  it('muestra el badge DEMO', () => {
    const badge = wrapper.find('.demo-badge')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('DEMO')
  })

  it('muestra el botón Cerrar Sesión', () => {
    const btn = wrapper.find('button.btn-logout')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('Cerrar')
  })

  it('muestra el footer', () => {
    expect(wrapper.html()).toContain('impr3q')
    expect(wrapper.html()).toContain('Todos los derechos reservados')
  })
})

describe('Navigation Tests', () => {
  let wrapper: VueWrapper

  beforeEach(async () => {
    wrapper = await createWrapper()
  })

  it('click en Cotizar navega al formulario', async () => {
    await goToQuote(wrapper)
    expect(wrapper.html()).toContain('Solicita tu Cotización')
  })

  it('click en Solicitar Cotización navega al formulario', async () => {
    await wrapper.find('button.btn-primary').trigger('click')
    await nextTick()
    expect(wrapper.html()).toContain('Solicita tu Cotización')
  })
})

describe('Cotizador Tests', () => {
  let wrapper: VueWrapper

  beforeEach(async () => {
    wrapper = await createWrapper()
    await goToQuote(wrapper)
  })

  it('muestra el formulario de cotización', () => {
    expect(wrapper.html()).toContain('Solicita tu Cotización')
    expect(wrapper.find('input#name').exists()).toBe(true)
    expect(wrapper.find('input#email').exists()).toBe(true)
    expect(wrapper.find('select#service').exists()).toBe(true)
  })

  describe('Validación de campos requeridos', () => {
    it('valida que el nombre sea requerido', async () => {
      await wrapper.find('form.quote-form').trigger('submit')
      expect(globalThis.alert).toHaveBeenCalledWith('El nombre es requerido.')
    })

    it('valida que el email sea requerido', async () => {
      await wrapper.find('input#name').setValue('Juan')
      await wrapper.find('form.quote-form').trigger('submit')
      expect(globalThis.alert).toHaveBeenCalledWith('El correo electrónico es requerido.')
    })

    it('valida que el servicio sea seleccionado', async () => {
      await wrapper.find('input#name').setValue('Juan')
      await wrapper.find('input#email').setValue('juan@test.com')
      await wrapper.find('form.quote-form').trigger('submit')
      expect(globalThis.alert).toHaveBeenCalledWith('Selecciona un tipo de servicio.')
    })
  })

  describe('Agregar y eliminar items', () => {
    it('muestra items section al seleccionar 3d-printing', async () => {
      await wrapper.find('select#service').setValue('3d-printing')
      await nextTick()
      expect(wrapper.find('.items-section').exists()).toBe(true)
    })

    it('agrega un item al hacer click en + Agregar Item', async () => {
      await wrapper.find('select#service').setValue('3d-printing')
      await nextTick()
      await wrapper.find('button.btn-add-item').trigger('click')
      await nextTick()
      expect(wrapper.findAll('.item-card').length).toBe(2)
    })

    it('elimina un item al hacer click en X', async () => {
      await wrapper.find('select#service').setValue('3d-printing')
      await nextTick()
      await wrapper.find('button.btn-add-item').trigger('click')
      await nextTick()
      await wrapper.find('button.btn-remove').trigger('click')
      await nextTick()
      expect(wrapper.findAll('.item-card').length).toBe(1)
    })
  })

  describe('Cálculo de costos', () => {
    it('el resumen del pedido muestra subtotal y total', async () => {
      await wrapper.find('select#service').setValue('3d-printing')
      await nextTick()
      expect(wrapper.html()).toContain('Subtotal')
      expect(wrapper.html()).toContain('Total')
    })
  })

  describe('Imagen de referencia', () => {
    it('existe el input de tipo file', async () => {
      await wrapper.find('select#service').setValue('3d-printing')
      await nextTick()
      expect(wrapper.find('input[type="file"]').exists()).toBe(true)
    })
  })

  describe('Generar proforma', () => {
    it('genera proforma con datos válidos', async () => {
      await fillQuoteForm(wrapper)
      await submitQuote(wrapper)
      expect(wrapper.html()).toContain('Proforma Generada')
      expect(wrapper.text()).toContain('María García')
      expect(wrapper.text()).toContain('maria@test.com')
    })
  })
})

describe('Proforma Tests', () => {
  let wrapper: VueWrapper

  beforeEach(async () => {
    wrapper = await createWrapper()
    await goToQuote(wrapper)
    await fillQuoteForm(wrapper)
    await submitQuote(wrapper)
  })

  it('muestra la sección de proforma generada', () => {
    expect(wrapper.html()).toContain('Proforma Generada')
  })

  it('muestra los datos del cliente', () => {
    expect(wrapper.text()).toContain('María García')
    expect(wrapper.text()).toContain('maria@test.com')
  })

  it('muestra los items del pedido', () => {
    const rows = wrapper.findAll('.cost-table tbody tr')
    expect(rows.length).toBeGreaterThanOrEqual(1)
  })

  it('muestra el total calculado', () => {
    expect(wrapper.html()).toContain('TOTAL')
    expect(wrapper.html()).toContain('Subtotal')
  })

  it('tiene botón para generar PDF', () => {
    const btns = wrapper.findAll('button.submit-button')
    expect(btns.some(b => b.text().includes('Generar PDF'))).toBe(true)
  })

  it('tiene botón para nueva cotización', () => {
    const btns = wrapper.findAll('button.submit-button')
    expect(btns.some(b => b.text().includes('Nueva Cotización'))).toBe(true)
  })

  it('click en Nueva Cotización reinicia el formulario', async () => {
    const btns = wrapper.findAll('button.submit-button')
    const newBtn = btns.find(b => b.text().includes('Nueva'))
    await newBtn!.trigger('click')
    await nextTick()
    expect(wrapper.html()).toContain('Solicita tu Cotización')
  })
})
