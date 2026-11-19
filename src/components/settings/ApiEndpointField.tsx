import { useEffect, useState } from 'react'
import { useTranslate } from '../../i18n/index.js'
import { normalizeApiOrigin, setApiOrigin, useSettings } from '../../services/settings.js'
import { showToast } from '../base/toastState.js'
import styles from './Settings.module.css'

/**
 * API 地址：默认是 DeepSeek 官方地址，也可以填第三方中转或自建网关。
 * 修改后立即生效，但已保存的 API Key 属于旧服务，需要重新填写。
 */
export const ApiEndpointField = () => {
  const t = useTranslate()
  const apiOrigin = useSettings((state) => state.apiOrigin)
  const [value, setValue] = useState(apiOrigin)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setValue(apiOrigin)
  }, [apiOrigin])

  const save = () => {
    const normalized = normalizeApiOrigin(value)
    if (!normalized) {
      setError(t('settingsApiEndpointInvalid'))
      return
    }
    setError(null)
    if (normalized !== apiOrigin) {
      setApiOrigin(normalized)
      setValue(normalized)
      showToast({ key: 'settingsApiEndpointSaved' })
    }
  }

  return (
    <div className={styles.cell}>
      <div className={styles.apiKey}>
        <div className={styles.label}>{t('settingsApiEndpoint')}</div>
        <div className={styles.apiKeyInput}>
          <input
            type="url"
            inputMode="url"
            spellCheck={false}
            autoComplete="off"
            placeholder={t('settingsApiEndpointPlaceholder')}
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              setError(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                save()
              }
            }}
          />
          {value.trim() !== apiOrigin ? (
            <>
              <span className={styles.divider} />
              <button
                type="button"
                className={styles.confirm}
                onMouseDown={(event) => event.preventDefault()}
                onClick={save}
              >
                {t('confirm')}
              </button>
            </>
          ) : null}
        </div>
        <div className={styles.description}>{t('settingsApiEndpointDescription')}</div>
        {error ? <div className={styles.error}>{error}</div> : null}
      </div>
    </div>
  )
}
