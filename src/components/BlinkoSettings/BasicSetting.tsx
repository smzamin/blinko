import { Icon } from '@/components/Common/Iconify/icons';
import { eventBus } from "@/lib/event";
import { api } from "@/lib/trpc";
import { RootStore } from "@/store";
import { BlinkoStore } from "@/store/blinkoStore";
import { DialogStore } from "@/store/module/Dialog";
import { DialogStandaloneStore } from "@/store/module/DialogStandalone";
import { PromiseCall, PromiseState } from "@/store/standard/PromiseState";
import { UserStore } from "@/store/user";
import { Alert, Button, Input, Switch, Tooltip } from "@heroui/react";
import Avatar from "boring-avatars";
import { observer } from "mobx-react-lite";
import { AnimatePresence, motion } from "motion/react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CollapsibleCard } from "../Common/CollapsibleCard";
import { Copy } from "../Common/Copy";
import { MarkdownRender } from "../Common/MarkdownRender";
import { LinkAccountModal } from "../Common/Modals/LinkAccountModal";
import { showTipsDialog } from "../Common/TipsDialog";
import { ShowGen2FATokenModal } from "../Common/TwoFactorModal/gen2FATokenModal";
import { UpdateUserInfo, UpdateUserPassword } from "../Common/UpdateUserInfo";
import { UploadFileWrapper } from "../Common/UploadFile";
import { Item } from "./Item";

export const BasicSetting = observer(() => {
  const user = RootStore.Get(UserStore)
  const CODE = `curl -X 'POST' '${window.location.origin}/api/v1/note/upsert' \\\n      -H 'Content-Type: application/json' \\\n      -H 'Authorization: Bearer ${user.userInfo.value?.token}' \\\n      -d '{ "content": "🎉Hello,Blinko! --send from api ", "type":0 }'\n`
  const CODE_SNIPPET = `\`\`\`javascript\n //blinko api document:${window.location.origin}/api-doc\n ${CODE} \`\`\``
  const { t } = useTranslation()
  const router = useRouter()
  const blinko = RootStore.Get(BlinkoStore)

  const store = RootStore.Local(() => ({
    webhookEndpoint: '',
    totpToken: '',
    showToken: false,
    showQRCode: false,
    totpSecret: '',
    qrCodeUrl: '',
    showLowPermToken: false,
    lowPermToken: '',
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
    setShowLowPermToken(value: boolean) {
      this.showLowPermToken = value;
    },
    setLowPermToken(value: string) {
      this.lowPermToken = value;
    },
    setRigster: new PromiseState({
      function: async (value: boolean) => {
        return await PromiseCall(api.config.update.mutate({
          key: 'isAllowRegister',
          value
        }))
      }
    }),
    genLowPermToken: new PromiseState({
      function: async () => {
        const response = await PromiseCall(api.users.genLowPermToken.mutate());
        return response;
      }
    }),
  }))

  useEffect(() => {
    store.webhookEndpoint = blinko.config.value?.webhookEndpoint ?? ''
  }, [blinko.config.value])

  return (
    <CollapsibleCard
      icon="tabler:settings"
      title={t('basic-information')}
    >
      <Item
        leftContent={<>{t('name')}</>}
        rightContent={
          <div className="flex gap-2 items-center">
            <div className="text-desc">{user.name}</div>
            <div className="relative group">
              <UploadFileWrapper
                acceptImage
                onUpload={async ({ filePath }) => {
                  if (!user.userInfo.value?.id) return
                  await PromiseCall(api.users.upsertUser.mutate({
                    id: user.userInfo.value?.id,
                    image: filePath
                  }));
                  user.userInfo.call(user.userInfo.value?.id);
                }}
              >
                {user.userInfo.value?.image ? (
                  <img
                    src={user.userInfo.value.image}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <Avatar
                    size={30}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    name={user.nickname ?? user.name}
                    variant="beam"
                  />
                )}
              </UploadFileWrapper>
            </div>

            <Button variant="flat" isIconOnly startContent={<Icon icon="tabler:edit" width="20" height="20" />} size='sm'
              onPress={e => {
                RootStore.Get(DialogStore).setData({
                  isOpen: true,
                  title: t('change-user-info'),
                  content: <UpdateUserInfo />
                })
              }} />
            <Button variant="flat" isIconOnly startContent={<Icon icon="material-symbols:password" width="20" height="20" />} size='sm'
              onPress={e => {
                RootStore.Get(DialogStore).setData({
                  title: t('rest-user-info'),
                  isOpen: true,
                  content: <UpdateUserPassword />
                })
              }} />
            {
              user.userInfo?.value?.loginType == 'oauth' &&
              <Button variant="flat" isIconOnly startContent={<Icon icon="tabler:link" width="20" height="20" />} size='sm'
                onPress={e => {
                  RootStore.Get(DialogStore).setData({
                    title: t('link-account'),
                    isOpen: true,
                    size: 'md',
                    content: <LinkAccountModal />
                  })
                }} />
            }

            {
              user.userInfo?.value?.isLinked &&
              <Button color="danger" variant="flat" isIconOnly startContent={<Icon icon="lsicon:unlink-filled" width="20" height="20" />} size='sm'
                onPress={e => {
                  showTipsDialog({
                    title: t('unlink-account'),
                    content: t('unlink-account-tips'),
                    onConfirm: async () => {
                      await PromiseCall(api.users.unlinkAccount.mutate({
                        id: user.userInfo.value!.id
                      }))
                      eventBus.emit('user:signout')
                      RootStore.Get(DialogStandaloneStore).close()
                    }
                  })
                }} />
            }
          </div>
        }
      />

      <Item
        leftContent={
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div>{t('access-token')}</div>
              <Button
                isIconOnly
                variant="flat"
                size="sm"
                onPress={() => {
                  store.setShowToken(!store.showToken)
                }}
              >
                <Icon
                  icon={store.showToken ? "mdi:eye-off" : "mdi:eye"}
                  width="20"
                  height="20"
                />
              </Button>
            </div>
            <Tooltip content={<div className="text-sm text-desc max-w-[300px]">{t('low-permission-token-desc')}</div>}>
              <div
                className="text-xs text-yellow-500 cursor-pointer"
                onClick={async () => {
                  const response = await store.genLowPermToken.call();
                  if (response?.token) {
                    RootStore.Get(DialogStore).setData({
                      isOpen: true,
                      title: t('generate-low-permission-token'),
                      content: (
                        <div className="flex flex-col gap-4">
                          <Alert
                            color="warning"
                            description={t('low-permission-token-desc')}
                            title={t('this-token-is-only-displayed-once-please-save-it-properly')}
                            variant="faded"
                          />
                          <Input
                            readOnly
                            className="w-full"
                            value={response.token}
                            endContent={<Copy size={20} content={response.token} />}
                          />
                        </div>
                      )
                    });
                  }
                }}
              >
                {t('generate-low-permission-token')}
              </div>
            </Tooltip>
          </div>
        }
        rightContent={
          <div className="flex gap-2 items-center">
            <Input
              disabled
              className="w-[150px] md:w-[300px]"
              value={store.showToken ? user.userInfo.value?.token : '••••••••••••••••'}
              type={store.showToken ? "text" : "password"}
              endContent={<Copy size={20} content={user.userInfo.value?.token ?? ''} />}
            />

            <Icon
              className="cursor-pointer hover:rotate-180 transition-all"
              onClick={async () => {
                await PromiseCall(api.users.regenToken.mutate())
                user.userInfo.call(user.userInfo.value?.id ?? 0)
              }}
              icon="fluent:arrow-sync-12-filled"
              width="20"
              height="20"
            />
          </div>
        }
      />

      {
        <AnimatePresence>
          {store.showToken && (
            <motion.div
              initial={{ height: 0, opacity: 0, scale: 0.95 }}
              animate={{
                height: "auto",
                opacity: 1,
                scale: 1,
              }}
              exit={{
                height: 0,
                opacity: 0,
                scale: 0.95
              }}
              transition={{
                duration: 0.3,
                ease: [0.23, 1, 0.32, 1],
                scale: {
                  type: "spring",
                  damping: 15,
                  stiffness: 300
                }
              }}
            >
              <Item
                leftContent={
                  <div className="w-full flex-1 relative">
                    <Copy size={20} content={CODE} className="absolute top-4 right-2" />
                    <MarkdownRender content={CODE_SNIPPET} />
                  </div>
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      }

      {
        user.role == 'superadmin' &&
        <Item
          leftContent={<>{t('allow-register')}</>}
          rightContent={<Switch
            thumbIcon={store.setRigster.loading.value ? <Icon icon="eos-icons:three-dots-loading" width="24" height="24" /> : null}
            isDisabled={store.setRigster.loading.value}
            isSelected={user.canRegister.value}
            onChange={async e => {
              await store.setRigster.call(e.target.checked)
              user.canRegister.call()
            }}
          />} />
      }

      {
        user.role == 'superadmin' &&
        <Item
          leftContent={<>Webhook</>}
          rightContent={<>
            <Input
              placeholder="Enter webhook URL"
              value={store.webhookEndpoint}
              onChange={(e) => store.webhookEndpoint = e.target.value}
              onBlur={async () => {
                await PromiseCall(api.config.update.mutate({
                  key: 'webhookEndpoint',
                  value: store.webhookEndpoint
                }))
              }}
              className="w-[150px] md:w-[300px]"
            />
          </>} />
      }
      <Item
        leftContent={<>{t('two-factor-authentication')}</>}
        rightContent={
          <div className="flex gap-2 items-center">
            <Switch
              isSelected={blinko.config.value?.twoFactorEnabled ?? false}
              onChange={async (e) => {
                if (!e.target.checked) {
                  await PromiseCall(api.config.update.mutate({
                    key: 'twoFactorEnabled',
                    value: false
                  }));
                  blinko.config.call();
                } else {
                  const response = await PromiseCall(api.users.generate2FASecret.mutate({
                    name: user.name!
                  }), { autoAlert: false });
                  if (response) {
                    ShowGen2FATokenModal({
                      qrCodeUrl: response.qrCode,
                      totpSecret: response.secret
                    })
                  }
                }
              }}
            />
          </div>
        }
      />


      <Item
        leftContent={<></>}
        rightContent={
          <Tooltip placement="bottom" content={t('logout')}>
            <Button isIconOnly startContent={<Icon icon="hugeicons:logout-05" width="20" height="20" />} color='danger' onPress={async () => {
              await signOut({ redirect: false })
              eventBus.emit('user:signout')
            }}></Button>
          </Tooltip>
        } />
    </CollapsibleCard>
  );
})