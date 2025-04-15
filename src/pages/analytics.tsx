import { HeatMap } from "@/components/BlinkoAnalytics/HeatMap"
import { StatsCards } from "@/components/BlinkoAnalytics/StatsCards"
import { TagDistributionChart } from "@/components/BlinkoAnalytics/TagDistributionChart"
import { Icon } from '@/components/Common/Iconify/icons'
import { AnalyticsStore } from "@/store/analyticsStore"
import { RootStore } from "@/store/root"
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react"
import dayjs from "dayjs"
import { observer } from "mobx-react-lite"
import React, { useEffect } from 'react'
import { useTranslation } from "react-i18next"

const Analytics = observer(() => {
  const analyticsStore = RootStore.Get(AnalyticsStore)
  const { t } = useTranslation()
  const [selectedMonth, setSelectedMonth] = React.useState(dayjs().format("YYYY-MM"))
  analyticsStore.use()

  useEffect(() => {
    analyticsStore.setSelectedMonth(selectedMonth)
  }, [selectedMonth])

  const currentMonth = dayjs().format("YYYY-MM")
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    return dayjs().subtract(i, "month").format("YYYY-MM")
  })

  const data = analyticsStore.dailyNoteCount.value?.map(item => [
    item.date,
    item.count
  ] as [string, number]) ?? []

  const stats = analyticsStore.monthlyStats.value

  return (
    <div className="p-6 space-y-6 mx-auto max-w-7xl">
      <div className="w-72">
        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="flat"
              className="w-[160px] justify-between bg-default-100 hover:bg-default-200"
              size="md"
              endContent={<Icon icon="mdi:chevron-down" className="h-4 w-4" />}
              startContent={<Icon icon="mdi:calendar" className="h-4 w-4" />}
            >
              {selectedMonth}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Select month"
            selectionMode="single"
            selectedKeys={[selectedMonth]}
            className="max-h-[400px]"
            onSelectionChange={(key) => {
              const value = Array.from(key)[0] as string
              setSelectedMonth(value)
            }}
          >
            {last12Months.map((month) => (
              <DropdownItem
                key={month}
                className="data-[selected=true]:bg-primary-500/20"
              >
                {month}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>

      <StatsCards stats={stats ?? {}} />

      <HeatMap
        data={data}
        title={t('heatMapTitle')}
        description={t('heatMapDescription')}
      />

      {stats?.tagStats && stats.tagStats.length > 0 && (
        <TagDistributionChart tagStats={stats.tagStats} />
      )}
    </div>
  )
})

export default Analytics