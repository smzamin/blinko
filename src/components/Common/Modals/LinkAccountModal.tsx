import { eventBus } from "@/lib/event";
import { api } from "@/lib/trpc";
import { RootStore } from "@/store";
import { DialogStore } from "@/store/module/Dialog";
import { PromiseCall } from "@/store/standard/PromiseState";
import { Alert, Button, Input, Select, SelectItem } from "@heroui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";


export const LinkAccountModal = observer(() => {
  const { t } = useTranslation();
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [password, setPassword] = useState("");
  const [accounts, setAccounts] = useState<{ id: number, name: string, nickname: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      const result = await api.users.nativeAccountList.query();
      setAccounts(result);
    };
    fetchAccounts();
  }, []);

  const handleLinkAccount = async () => {
    if (!selectedAccount || !password) return;
    setLoading(true);
    try {
      await PromiseCall(api.users.linkAccount.mutate({
        id: Number(selectedAccount),
        originalPassword: password
      }))
      RootStore.Get(DialogStore).close();
      eventBus.emit('user:signout')
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Select
        label={t('select-account')}
        placeholder={'username'}
        value={selectedAccount}
        onChange={(e) => setSelectedAccount(e.target.value)}
      >
        {accounts.map((account) => (
          <SelectItem key={account.id} >
            {account.nickname}
          </SelectItem>
        ))}
      </Select>

      <Input
        type="password"
        label={t('password')}
        placeholder={'12345678'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Alert color={'warning'} title={t('link-account-warning')} />

      <Button
        color="primary"
        isLoading={loading}
        onPress={handleLinkAccount}
        className="mt-2"
      >
        {t('link-account')}
      </Button>
    </div>
  );
});