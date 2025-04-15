import { Icon } from '@/components/Common/Iconify/icons';
import { api } from "@/lib/trpc";
import { RootStore } from "@/store";
import { BlinkoStore } from "@/store/blinkoStore";
import { DialogStore } from "@/store/module/Dialog";
import { ToastPlugin } from "@/store/module/Toast/Toast";
import { PromiseCall } from "@/store/standard/PromiseState";
import { Button, InputOtp } from "@heroui/react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";

interface TwoFactorModalProps {
  onConfirm?: (code: string) => void;
  isLoading?: boolean;
  qrCodeUrl: string;
  totpSecret: string;
}

export function Gen2FATokenModal({ onConfirm, isLoading, qrCodeUrl, totpSecret }: TwoFactorModalProps) {
  const { t } = useTranslation();
  const blinko = RootStore.Get(BlinkoStore)
  const store = RootStore.Local(() => ({
    totpToken: '',
    showToken: false,
    showQRCode: false,
    setShowToken(value: boolean) {
      this.showToken = value;
    },
    setShowQRCode(value: boolean) {
      this.showQRCode = value;
    },
    setTotpSecret(value: string) {
      this.totpSecret = value;
    },
    setQrCodeUrl(value: string) {
      this.qrCodeUrl = value;
    },
    async verify() {
      try {
        await Promise.all([
          PromiseCall(api.users.verify2FAToken.mutate({
            token: store.totpToken,
            secret: totpSecret
          }), {
            autoAlert: false
          }),
          PromiseCall(api.config.update.mutate({
            key: 'twoFactorSecret',
            value: totpSecret
          }), {
            autoAlert: false
          }),
          PromiseCall(api.config.update.mutate({
            key: 'twoFactorEnabled',
            value: true
          }), {
            autoAlert: false
          })
        ])
        RootStore.Get(ToastPlugin).success(t('2fa-setup-successful'))
        RootStore.Get(DialogStore).close()
        blinko.config.call();
      } catch (error) {
        console.error('2FA verification failed:', error);
      }
    }
  }))

  return (
    <div className="flex flex-col gap-2 items-center">
      <Icon icon="hugeicons:authorized" width="30" height="30" />
      <div className="text-xl font-bold text-center">{t('scan-this-qr-code-with-your-authenticator-app')}</div>
      <div className="flex justify-center items-center bg-white rounded-xl p-2 w-fit margin-auto mt-2">
        <QRCodeSVG value={qrCodeUrl} size={200} />
      </div>
      <div className="text-desc text-xs text-center">{t('or-enter-this-code-manually')} {totpSecret}</div>
      <InputOtp
        className="mt-2"
        length={6} radius="lg" size='lg'
        onComplete={e => {
          store.totpToken = e
          store.verify()
        }} />

      <Button
        className="mt-2"
        color="primary"
        onPress={async () => {
          await store.verify()
        }}
      >
        {t('verify')}
      </Button>
    </div >
  );
}


export const ShowGen2FATokenModal = (props: TwoFactorModalProps) => {
  RootStore.Get(DialogStore).setData({
    isOpen: true,
    size: 'lg',
    content: <Gen2FATokenModal {...props} />
  })
}

