import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingCart, Trash2, Plus, Minus, Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useCartStore, getCardPrice } from '../../store/useCartStore'
import { createOrder } from '../../services/orderService'
import toast from 'react-hot-toast'

export function CartSidebar({ isOpen, onClose, whatsappNumber, sellerName, sellerSlug }) {
  const queryClient = useQueryClient()
  const { items, removeItem, updateQuantity, clearCart } = useCartStore()
  const [buyerName, setBuyerName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const totalItems = items.reduce((total, item) => total + item.cartQuantity, 0)
  const inventoryItems = items.filter(i => !i.isWishlist)
  const wishlistItems = items.filter(i => i.isWishlist)

  // Total estimado de compra (inventario)
  const totalInventoryPrice = inventoryItems.reduce((acc, item) => {
    const price = getCardPrice(item.card)
    return price !== null ? acc + price * item.cartQuantity : acc
  }, 0)

  const unpricedInventoryCount = inventoryItems
    .filter(i => getCardPrice(i.card) === null)
    .reduce((acc, i) => acc + i.cartQuantity, 0)

  const handleSendWhatsApp = async () => {
    if (!whatsappNumber || isSubmitting) return
    setIsSubmitting(true)

    let orderData = null
    try {
      if (inventoryItems.length > 0 && sellerSlug) {
        orderData = await createOrder({
          sellerSlug,
          buyerName: buyerName.trim() || undefined,
          items: inventoryItems.map(item => ({
            cardId: item.card.id,
            quantity: item.cartQuantity,
          })),
        })
        queryClient.invalidateQueries({ queryKey: ['portfolio'] })
        toast.success(`¡Pedido #${orderData.orderNumber} registrado!`, { duration: 3500 })
      }
    } catch (err) {
      toast.error(err.message || 'Error al procesar el pedido')
      setIsSubmitting(false)
      return
    }

    const greetingName = buyerName.trim() ? `, soy ${buyerName.trim()}` : ''
    let message = `Hola ${sellerName}${greetingName}, vi tu portafolio.\n\n`
    
    if (inventoryItems.length > 0) {
      message += `Estoy interesado en adquirir las siguientes cartas de tu inventario:\n`
      inventoryItems.forEach((item) => {
        const { card, cartQuantity } = item
        const unitPrice = getCardPrice(card)
        const details = []
        if (card.setCode) details.push(card.setCode)
        if (card.rarity) details.push(card.rarity)
        if (card.edition) details.push(card.edition)
        
        const detailStr = details.length > 0 ? ` (${details.join(', ')})` : ''
        const priceStr = unitPrice !== null 
          ? ` - $${(unitPrice * cartQuantity).toFixed(2)} USD${cartQuantity > 1 ? ` ($${unitPrice.toFixed(2)} c/u)` : ''}`
          : ''
        message += `- ${cartQuantity}x ${card.name}${detailStr}${priceStr}\n`
      })

      if (totalInventoryPrice > 0) {
        message += `\n*Total estimado:* $${totalInventoryPrice.toFixed(2)} USD`
        if (unpricedInventoryCount > 0) {
          message += ` (+ cartas por cotizar)`
        }
        message += `\n\n¿Están disponibles y me confirmas el total?\n\n`
      } else {
        message += `\n¿Están disponibles y qué precio tendrían?\n\n`
      }
    }
    
    if (wishlistItems.length > 0) {
      message += `Tengo las siguientes cartas de tu lista de deseos y te las puedo ofrecer:\n`
      wishlistItems.forEach((item) => {
        const { card, cartQuantity } = item
        const unitPrice = getCardPrice(card)
        const details = []
        if (card.setCode) details.push(card.setCode)
        if (card.rarity) details.push(card.rarity)
        if (card.edition) details.push(card.edition)
        
        const detailStr = details.length > 0 ? ` (${details.join(', ')})` : ''
        const priceStr = unitPrice !== null 
          ? ` [Ref: $${unitPrice.toFixed(2)} USD]` 
          : ''
        message += `- ${cartQuantity}x ${card.name}${detailStr}${priceStr}\n`
      })
      message += `\n¿Te interesaría hacer un trato por ellas?\n`
    }
    
    const encodedMessage = encodeURIComponent(message)
    const waUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`
    
    window.open(waUrl, '_blank')
    clearCart()
    setIsSubmitting(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[400px] bg-[#0f1117] border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg">Tu Carrito</h2>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span>{totalItems} carta{totalItems !== 1 ? 's' : ''}</span>
                    {totalInventoryPrice > 0 && (
                      <span className="text-emerald-400 font-mono font-semibold">
                        • ${totalInventoryPrice.toFixed(2)} USD
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white active:scale-[0.96] transition-[background-color,color,transform] duration-150 ease-out cursor-pointer"
                title="Cerrar carrito"
              >
                <X className="w-5 h-5 stroke-2" />
              </button>
            </div>

            {/* Lista de Cartas */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                  <ShoppingCart className="w-16 h-16 text-slate-500 mb-4" />
                  <p className="text-white font-medium">Tu carrito está vacío</p>
                  <p className="text-sm text-slate-400 mt-1 max-w-[250px]">
                    Explora el portafolio y añade cartas para enviar una solicitud al vendedor.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => {
                    const { card, cartQuantity } = item
                    const unitPrice = getCardPrice(card)
                    const itemTotal = unitPrice !== null ? unitPrice * cartQuantity : null

                    return (
                      <div 
                        key={`${card.id}-${item.isWishlist ? 'wishlist' : 'inventory'}`} 
                        className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-colors duration-150 ease-out"
                      >
                        <div className="w-16 h-24 shrink-0 rounded-md overflow-hidden bg-black/40 border border-white/10 relative">
                          <img 
                            src={card.imageSmall || card.image} 
                            alt={card.name} 
                            className="w-full h-full object-cover outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                            onError={(e) => { e.target.onerror = null; e.target.src = '/card-placeholder.png' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          {/* Top: Nombre y botón eliminar */}
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <h3 className="text-sm font-bold text-white truncate" title={card.name}>{card.name}</h3>
                              <button 
                                onClick={() => removeItem(card.id, item.isWishlist)}
                                className="w-7 h-7 -mr-1 -mt-1 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 active:scale-[0.96] transition-[background-color,color,transform] duration-150 ease-out shrink-0 cursor-pointer"
                                title="Eliminar del carrito"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                              {card.setCode && (
                                <span className="font-mono text-[11px] text-amber-400/90 font-medium">{card.setCode}</span>
                              )}
                              {card.rarity && (
                                <span>{card.setCode ? '• ' : ''}{card.rarity}</span>
                              )}
                              {card.edition && (
                                <span>• {card.edition}</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Bottom: Controles de cantidad y precio */}
                          <div className="mt-2 flex items-end justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 bg-black/40 rounded-lg border border-white/5 p-0.5">
                                <button 
                                  onClick={() => updateQuantity(card.id, Math.max(1, cartQuantity - 1), item.isWishlist)}
                                  disabled={cartQuantity <= 1}
                                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 active:scale-[0.96] transition-[background-color,color,transform] duration-150 ease-out disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-6 text-center text-xs font-bold text-white tabular-nums">
                                  {cartQuantity}
                                </span>
                                <button 
                                  onClick={() => updateQuantity(card.id, item.isWishlist ? cartQuantity + 1 : Math.min(card.quantity, cartQuantity + 1), item.isWishlist)}
                                  disabled={!item.isWishlist && cartQuantity >= card.quantity}
                                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 active:scale-[0.96] transition-[background-color,color,transform] duration-150 ease-out disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {item.isWishlist && (
                                <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 uppercase tracking-wider">
                                  Ofrecer
                                </span>
                              )}
                            </div>
                            
                            {/* Visualización del precio */}
                            <div className="text-right flex flex-col items-end shrink-0">
                              {item.isWishlist ? (
                                unitPrice !== null ? (
                                  <span className="text-xs text-purple-300 font-mono" title="Precio de referencia">
                                    ${(unitPrice * cartQuantity).toFixed(2)} Ref.
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-500 italic">
                                    A negociar
                                  </span>
                                )
                              ) : unitPrice !== null ? (
                                <>
                                  <span className="text-sm font-bold text-emerald-400 font-mono leading-none">
                                    ${itemTotal.toFixed(2)}
                                  </span>
                                  {cartQuantity > 1 ? (
                                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      ${unitPrice.toFixed(2)} c/u
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">
                                      USD
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-[11px] text-slate-500 italic">
                                  Por cotizar
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-5 border-t border-white/10 bg-black/30 backdrop-blur-sm">
                {/* Resumen de totales */}
                <div className="mb-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Total de cartas</span>
                    <span className="text-slate-200 font-semibold">
                      {totalItems} {totalItems === 1 ? 'carta' : 'cartas'}
                      {wishlistItems.length > 0 && inventoryItems.length > 0 && (
                        <span className="text-slate-400 font-normal">
                          {' '}({inventoryItems.reduce((acc, i) => acc + i.cartQuantity, 0)} compra, {wishlistItems.reduce((acc, i) => acc + i.cartQuantity, 0)} oferta)
                        </span>
                      )}
                    </span>
                  </div>

                  {inventoryItems.length > 0 && (
                    <div className="pt-2 border-t border-white/5 flex items-baseline justify-between">
                      <div>
                        <span className="text-sm font-bold text-white">Total Estimado</span>
                        {unpricedInventoryCount > 0 && (
                          <p className="text-[10px] text-amber-400/90 mt-0.5">
                            * Incluye {unpricedInventoryCount} {unpricedInventoryCount === 1 ? 'carta' : 'cartas'} a cotizar
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {totalInventoryPrice > 0 ? (
                          <div className="flex items-baseline gap-1 justify-end">
                            <span className="text-xl font-extrabold text-emerald-400 font-mono tracking-tight">
                              ${totalInventoryPrice.toFixed(2)}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-500/80">USD</span>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-slate-400 font-mono">
                            Por cotizar
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {inventoryItems.length === 0 && wishlistItems.length > 0 && (
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-purple-400">Propuesta de Trade</span>
                      <span className="text-slate-400 italic">Precios a convenir</span>
                    </div>
                  )}
                </div>

                {/* Campo Nombre / Apodo (Opcional) */}
                <div className="mb-4">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tu Nombre o Apodo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    disabled={isSubmitting}
                    className="w-full bg-[#111827] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>

                {!whatsappNumber ? (
                  <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                    El vendedor no ha configurado su número de WhatsApp.
                  </div>
                ) : null}
                
                <button
                  onClick={handleSendWhatsApp}
                  disabled={!whatsappNumber || isSubmitting}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-[0.96] border border-emerald-400/30 text-white transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Apartando cartas...</span>
                    </>
                  ) : (
                    <>
                      <img src="/whatsapp.svg" alt="WhatsApp" className="w-6 h-6 drop-shadow-md" />
                      <span>Enviar pedido por WhatsApp</span>
                    </>
                  )}
                </button>
                <div className="text-center mt-3">
                  <button 
                    onClick={clearCart}
                    className="text-xs text-slate-500 hover:text-slate-300 active:scale-[0.96] transition-[color,transform] duration-150 ease-out cursor-pointer"
                  >
                    Vaciar carrito
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

