'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FilePlus2, Camera } from 'lucide-react'
import ScannerModal from './ScannerModal'

export default function DashboardActions() {
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  return (
    <>
      <div className="flex items-center gap-3 mt-4">
        <button 
          onClick={() => setIsScannerOpen(true)}
          className="btn-rabbu-secondary h-12"
        >
          <Camera className="w-4 h-4" />
          Digitalizar Prova
        </button>
        <Link href="/nova-prova" className="btn-rabbu h-12 px-8">
          <FilePlus2 className="w-4 h-4" />
          Gerar Nova Prova
        </Link>
      </div>

      <ScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
      />
    </>
  )
}
