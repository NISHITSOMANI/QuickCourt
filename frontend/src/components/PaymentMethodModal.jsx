import { useState } from 'react'
import { 
  CreditCard, 
  Smartphone, 
  Wallet, 
  Banknote, 
  X,
  Check,
  DollarSign
} from 'lucide-react'

const PaymentMethodModal = ({ 
  isOpen, 
  onClose, 
  onPaymentMethodSelect, 
  totalAmount,
  bookingDetails 
}) => {
  const [selectedMethod, setSelectedMethod] = useState('')

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Pay using your credit or debit card',
      icon: CreditCard,
      enabled: true,
    },
    {
      id: 'upi',
      name: 'UPI',
      description: 'Pay using UPI apps like GPay, PhonePe, Paytm',
      icon: Smartphone,
      enabled: true,
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      description: 'Pay using digital wallets',
      icon: Wallet,
      enabled: true,
    },
    {
      id: 'cash',
      name: 'Cash on Arrival',
      description: 'Pay cash when you arrive at the venue',
      icon: Banknote,
      enabled: true,
    },
  ]

  const handleMethodSelect = (methodId) => {
    setSelectedMethod(methodId)
  }

  const handleConfirmPayment = () => {
    if (!selectedMethod) {
      return
    }
    onPaymentMethodSelect(selectedMethod)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Choose Payment Method</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Booking Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Booking Summary</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Venue:</span>
              <span className="font-medium">{bookingDetails?.venueName}</span>
            </div>
            <div className="flex justify-between">
              <span>Court:</span>
              <span className="font-medium text-gray-500">{bookingDetails?.courtName}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span className="font-medium text-gray-500">{bookingDetails?.date}</span>
            </div>
            <div className="flex justify-between">
              <span>Time:</span>
              <span className="font-medium text-gray-500">{bookingDetails?.timeSlot}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between text-lg font-semibold text-gray-900">
              <span>Starting Price:</span>
              <span className="text-primary-600">
                <DollarSign className="w-4 h-4 inline" />
                {totalAmount}/hr
              </span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3 mb-6">
          <h4 className="font-medium text-gray-900">Select Payment Method</h4>
          {paymentMethods.map((method) => {
            const IconComponent = method.icon
            return (
              <div
                key={method.id}
                onClick={() => method.enabled && handleMethodSelect(method.id)}
                className={`
                  relative border rounded-lg p-4 cursor-pointer transition-all
                  ${method.enabled 
                    ? 'hover:border-primary-300 hover:bg-primary-50' 
                    : 'opacity-50 cursor-not-allowed bg-gray-50'
                  }
                  ${selectedMethod === method.id 
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' 
                    : 'border-gray-200'
                  }
                `}
              >
                <div className="flex items-start space-x-3">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full
                    ${selectedMethod === method.id 
                      ? 'bg-primary-100 text-primary-600' 
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{method.name}</h5>
                    <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                  </div>
                  {selectedMethod === method.id && (
                    <div className="flex items-center justify-center w-6 h-6 bg-primary-600 rounded-full">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmPayment}
            disabled={!selectedMethod}
            className={`
              flex-1 px-4 py-2 rounded-md font-medium transition-colors
              ${selectedMethod
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Continue to Booking
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentMethodModal
