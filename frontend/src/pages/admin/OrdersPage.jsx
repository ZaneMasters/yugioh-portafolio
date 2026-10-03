import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ClipboardList, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  PackageCheck, 
  Layers, 
  AlertCircle, 
  RefreshCw, 
  ArrowUpRight, 
  Check, 
  ExternalLink,
  User,
  ShoppingBag,
  Folder
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getOrders, updateOrderStatus } from '../../services/orderService'
import { ConfirmModal } from '../../components/ui/ConfirmDeleteModal'
import { queryKeys } from '../../lib/queryKeys'
import toast from 'react-hot-toast'

export default function OrdersPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('pending') // 'pending' | 'completed' | 'cancelled'
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    orderId: null,
    orderNumber: null,
    newStatus: null,
    type: 'danger',
    title: '',
    description: '',
    confirmText: '',
    confirmIcon: null,
  })

  // Consulta en caché con TanStack Query (1 minuto de staleTime evita peticiones repetitivas al cambiar de pestaña)
  const { data, isLoading: loading, isFetching, refetch } = useQuery({
    queryKey: queryKeys.orders(),
    queryFn: () => getOrders(),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const orders = data?.orders || []
  const metrics = data?.metrics || {
    pendingCount: 0,
    completedCount: 0,
    totalSalesAmount: 0,
    totalSoldCards: 0
  }

  const handleOpenCancelModal = (order) => {
    setConfirmModal({
      open: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      newStatus: 'cancelled',
      type: 'danger',
      title: `¿Cancelar y liberar pedido #${order.orderNumber}?`,
      description: 'Las cartas apartadas se liberarán y volverán a estar disponibles de inmediato en tu vitrina pública para otros clientes.',
      confirmText: 'Liberar Cartas',
      confirmIcon: XCircle,
    })
  }

  const handleOpenCompleteModal = (order) => {
    setConfirmModal({
      open: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      newStatus: 'completed',
      type: 'success',
      title: `¿Confirmar venta #${order.orderNumber}?`,
      description: 'Las cartas se descontarán definitivamente de tu inventario y el pedido pasará a tu Historial de Ventas.',
      confirmText: 'Confirmar Venta',
      confirmIcon: CheckCircle2,
    })
  }

  const handleConfirmModalAction = async () => {
    const { orderId, newStatus, orderNumber } = confirmModal
    if (!orderId || !newStatus) return

    setActionLoadingId(orderId)
    try {
      await updateOrderStatus(orderId, newStatus)
      toast.success(
        newStatus === 'completed'
          ? `¡Venta #${orderNumber} confirmada con éxito!`
          : `Pedido #${orderNumber} cancelado y cartas liberadas.`
      )
      setConfirmModal((prev) => ({ ...prev, open: false }))
      queryClient.invalidateQueries({ queryKey: queryKeys.orders() })
      queryClient.invalidateQueries({ queryKey: ['cards'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-lookup'] })
    } catch (err) {
      toast.error(err.message || 'Error al actualizar el estado del pedido')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Filtrado de pedidos según tab activo
  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'pending') return order.status === 'pending'
    if (activeTab === 'completed') return order.status === 'completed'
    if (activeTab === 'cancelled') return order.status === 'cancelled' || order.status === 'expired'
    return true
  })

  // Helper para calcular tiempo restante de expiración
  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return 'Expirado'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h restantes`
    }
    return `${hours}h ${minutes}m restantes`
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-display flex items-center gap-2.5">
            <ClipboardList className="w-7 h-7 text-amber-500 shrink-0" />
            <span>Gestión de <span className="text-gradient-amber text-amber-400">Pedidos</span></span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Administra las cartas apartadas por clientes, valida pagos y consulta tu historial de ventas.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.96] text-slate-300 text-xs font-semibold border border-white/10 transition-all duration-150 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* MÉTRICAS SUPERIORES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="glass rounded-2xl p-4 md:p-5 border border-white/5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pendientes</p>
            <p className="text-xl md:text-2xl font-bold text-white mt-0.5">{metrics.pendingCount}</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 md:p-5 border border-white/5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ventas Cerradas</p>
            <p className="text-xl md:text-2xl font-bold text-white mt-0.5">{metrics.completedCount}</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 md:p-5 border border-white/5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cartas Vendidas</p>
            <p className="text-xl md:text-2xl font-bold text-white mt-0.5">{metrics.totalSoldCards}</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 md:p-5 border border-white/5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Ingresos</p>
            <p className="text-xl md:text-2xl font-bold text-emerald-400 font-mono mt-0.5">
              ${Number(metrics.totalSalesAmount || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* TABS DE FILTRADO */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer active:scale-[0.96] transition-all duration-150 ${
            activeTab === 'pending'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>Pendientes / Apartadas</span>
          {metrics.pendingCount > 0 && (
            <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {metrics.pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer active:scale-[0.96] transition-all duration-150 ${
            activeTab === 'completed'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Historial de Ventas</span>
          {metrics.completedCount > 0 && (
            <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {metrics.completedCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('cancelled')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer active:scale-[0.96] transition-all duration-150 ${
            activeTab === 'cancelled'
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <XCircle className="w-4 h-4 shrink-0" />
          <span>Cancelados / Expirados</span>
        </button>
      </div>

      {/* CONTENIDO PRINCIPAL: LISTA DE PEDIDOS */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm">Cargando pedidos...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-white/5 flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-500">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">
            {activeTab === 'pending'
              ? 'No tienes pedidos pendientes'
              : activeTab === 'completed'
                ? 'Aún no tienes ventas confirmadas'
                : 'No hay pedidos cancelados'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm">
            {activeTab === 'pending'
              ? 'Cuando un visitante añada cartas al carrito y te escriba por WhatsApp, aparecerán aquí para que valides el trato.'
              : 'Los pedidos que confirmes como vendidos aparecerán en este historial.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order) => {
              const remainingTime = getTimeRemaining(order.expiresAt)
              const isPending = order.status === 'pending'
              const isCompleted = order.status === 'completed'

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 6, transition: { duration: 0.15, ease: 'easeOut' } }}
                  className="glass rounded-2xl border border-white/5 p-5 md:p-6 space-y-4 shadow-xl shadow-black/20"
                >
                  {/* Fila Cabecera del Pedido */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-base font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                        #{order.orderNumber}
                      </span>
                      
                      {isPending && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Clock className="w-3.5 h-3.5 animate-pulse" />
                          <span>Apartado ({remainingTime})</span>
                        </span>
                      )}

                      {isCompleted && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Venta Concretada</span>
                        </span>
                      )}

                      {order.status === 'cancelled' && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancelado</span>
                        </span>
                      )}

                      {order.status === 'expired' && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/50 text-slate-400 border border-white/10">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Expiró automáticamente</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <strong className="text-slate-200">{order.buyerName || 'Cliente anónimo'}</strong>
                      </span>
                      <span>•</span>
                      <span>{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Listado de Cartas del Pedido */}
                  <div className="space-y-2.5">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5 gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-14 object-contain rounded shrink-0 bg-black/40 outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                            onError={(e) => { e.target.onerror = null; e.target.src = '/card-placeholder.png'; }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{item.name}</p>
                            <div className="flex flex-wrap gap-1.5 items-center mt-1 text-[11px] text-slate-400">
                              {item.setCode && (
                                <span className="font-mono text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20">
                                  {item.setCode}
                                </span>
                              )}
                              {item.rarity && <span>{item.rarity}</span>}
                              {item.edition && <span>• {item.edition}</span>}

                              {/* Colección / Carpetas donde está guardada la carta */}
                              {item.folderNames && item.folderNames.length > 0 ? (
                                item.folderNames.map((fName, fIdx) => (
                                  <span
                                    key={fIdx}
                                    className="inline-flex items-center gap-1 font-semibold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 rounded text-[10px]"
                                    title={`Ubicación en inventario: Colección "${fName}"`}
                                  >
                                    <Folder className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                                    {fName}
                                  </span>
                                ))
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 text-slate-500 bg-white/5 border border-white/5 px-1.5 py-0.5 rounded text-[10px]"
                                  title="Esta carta no está asignada a ninguna carpeta específica"
                                >
                                  <Folder className="w-2.5 h-2.5 opacity-50 shrink-0" />
                                  General
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs text-slate-400">
                            <span className="font-bold text-white">×{item.quantity}</span>
                            {item.unitPrice > 0 && ` ($${item.unitPrice.toFixed(2)})`}
                          </p>
                          <p className="text-sm font-bold text-emerald-400 font-mono">
                            ${Number(item.subtotal || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pie del Pedido con Total y Botones de Acción */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total del Pedido:</span>
                      <span className="text-xl font-black text-emerald-400 font-mono">
                        ${Number(order.totalAmount || 0).toFixed(2)} USD
                      </span>
                    </div>

                    {isPending && (
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => handleOpenCancelModal(order)}
                          disabled={actionLoadingId === order.id}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 active:scale-[0.96] border border-red-500/20 transition-all duration-150 cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4 shrink-0" />
                          <span>Cancelar y Liberar</span>
                        </button>

                        <button
                          onClick={() => handleOpenCompleteModal(order)}
                          disabled={actionLoadingId === order.id}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 active:scale-[0.96] transition-all duration-150 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-4 h-4 shrink-0" />
                          <span>Confirmar Venta</span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      <ConfirmModal
        open={confirmModal.open}
        loading={actionLoadingId !== null}
        title={confirmModal.title}
        description={confirmModal.description}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        confirmIcon={confirmModal.confirmIcon}
        onConfirm={handleConfirmModalAction}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
      />
    </div>
  )
}
