import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingCart, Trash2, Plus, Minus } from 'lucide-react'
import { useCartStore } from '../../store/useCartStore'

export function CartSidebar({ isOpen, onClose, whatsappNumber, sellerName }) {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore()
  
  const totalItems = items.reduce((total, item) => total + item.cartQuantity, 0)

  const handleSendWhatsApp = () => {
    if (!whatsappNumber) return
    
    const inventoryItems = items.filter(i => !i.isWishlist)
    const wishlistItems = items.filter(i => i.isWishlist)
    
    let message = `Hola ${sellerName}, vi tu portafolio.\n\n`
    
    if (inventoryItems.length > 0) {
      message += `Estoy interesado en adquirir las siguientes cartas de tu inventario:\n`
      inventoryItems.forEach((item) => {
        const { card, cartQuantity } = item
        const details = []
        if (card.setCode) details.push(card.setCode)
        if (card.rarity) details.push(card.rarity)
        if (card.edition) details.push(card.edition)
        
        const detailStr = details.length > 0 ? ` (${details.join(', ')})` : ''
        message += `- ${cartQuantity}x ${card.name}${detailStr}\n`
      })
      message += `\n¿Están disponibles y qué precio tendrían?\n\n`
    }
    
    if (wishlistItems.length > 0) {
      message += `Tengo las siguientes cartas de tu lista de deseos y te las puedo ofrecer:\n`
      wishlistItems.forEach((item) => {
        const { card, cartQuantity } = item
        const details = []
        if (card.setCode) details.push(card.setCode)
        if (card.rarity) details.push(card.rarity)
        if (card.edition) details.push(card.edition)
        
        const detailStr = details.length > 0 ? ` (${details.join(', ')})` : ''
        message += `- ${cartQuantity}x ${card.name}${detailStr}\n`
      })
      message += `\n¿Te interesaría hacer un trato por ellas?\n`
    }
    
    const encodedMessage = encodeURIComponent(message)
    const waUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`
    
    window.open(waUrl, '_blank')
    clearCart()
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
                  <p className="text-xs text-slate-400">{totalItems} carta{totalItems !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
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
                    return (
                      <div key={card.id} className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-colors">
                        <div className="w-16 h-24 shrink-0 rounded-md overflow-hidden bg-black/40 border border-white/10">
                          <img 
                            src={card.imageSmall || card.image} 
                            alt={card.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.onerror = null; e.target.src = '/card-placeholder.png' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col py-1">
                          <h3 className="text-sm font-bold text-white truncate">{card.name}</h3>
                          <div className="text-xs text-slate-400 mt-0.5 space-x-1 truncate">
                            {card.rarity && <span>{card.rarity}</span>}
                            {card.condition && <span>• {card.condition}</span>}
                            {card.edition && <span>• {card.edition}</span>}
                          </div>
                          
                          <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center gap-1 bg-black/40 rounded-lg border border-white/5 p-0.5">
                              <button 
                                onClick={() => updateQuantity(card.id, Math.max(1, cartQuantity - 1), item.isWishlist)}
                                disabled={cartQuantity <= 1}
                                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-6 text-center text-xs font-bold text-white">
                                {cartQuantity}
                              </span>
                              <button 
                                onClick={() => updateQuantity(card.id, item.isWishlist ? cartQuantity + 1 : Math.min(card.quantity, cartQuantity + 1), item.isWishlist)}
                                disabled={!item.isWishlist && cartQuantity >= card.quantity}
                                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {item.isWishlist && (
                                <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 uppercase tracking-wider">
                                  Ofrecer
                                </span>
                              )}
                              <button 
                                onClick={() => removeItem(card.id, item.isWishlist)}
                                className="p-1.5 rounded-md text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Eliminar del carrito"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
              <div className="p-5 border-t border-white/10 bg-black/20">
                {!whatsappNumber ? (
                  <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                    El vendedor no ha configurado su número de WhatsApp.
                  </div>
                ) : null}
                
                <button
                  onClick={handleSendWhatsApp}
                  disabled={!whatsappNumber}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/15 border border-[#25D366]/30 hover:border-[#25D366]/60 text-white transition-all shadow-[0_0_15px_rgba(37,211,102,0.15)] hover:shadow-[0_0_25px_rgba(37,211,102,0.25)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  <img src="/whatsapp.svg" alt="WhatsApp" className="w-6 h-6 drop-shadow-md" />
                  Enviar pedido por WhatsApp
                </button>
                <div className="text-center mt-3">
                  <button 
                    onClick={clearCart}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
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
