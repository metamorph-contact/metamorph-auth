import './security/csp-runtime'

import { createRoot } from 'react-dom/client'
import { PageTransitions, Toaster, TooltipProvider } from '@polymorph/ui/identity'
import { useTranslation } from 'react-i18next'

import './i18n'
import './app.css'
import { installPresentationTheme } from './presentation/theme'
import { IdentityRouter } from './router'
import { installBfcacheGuard } from './security/bfcache'

installPresentationTheme('shadcn-neutral')
installBfcacheGuard()

const root = document.getElementById('root')
if (root === null) throw new Error('Missing application root')

function LocalizedToaster() {
  const { t } = useTranslation()
  return <Toaster messages={{
    dismiss: t('toast.dismiss'),
    notification: t('toast.notification'),
    viewport: t('toast.viewport'),
  }} />
}

createRoot(root).render(
  <TooltipProvider>
    <PageTransitions>
      <IdentityRouter />
      <LocalizedToaster />
    </PageTransitions>
  </TooltipProvider>,
)
