import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { useTranslate } from '../../i18n/index.js'
import {
  DEFAULT_API_MODEL,
  DEFAULT_API_ORIGIN,
  normalizeApiOrigin,
  setApiModel,
  setApiOrigin,
  useSettings,
} from '../../services/settings.js'
import { showToast } from '../base/toastState.js'
import styles from './Settings.module.css'
import local from './ApiEndpointField.module.css'

type Mode = 'official' | 'custom'

const MODEL_PATTERN = /^[A-Za-z0-9._:/-]+$/

/**
 * API 设置：默认使用官方服务；选择自定义服务后展开地址和模型输入框。
 * 官方服务固定使用默认模型，切换后需要重新填写对应服务的 API Key。
 */
export const ApiEndpointField = () => {
  const t = useTranslate()
  const apiOrigin = useSettings((state) => state.apiOrigin)
  const apiModel = useSettings((state) => state.apiModel)
  const [mode, setMode] = useState<Mode>(
    apiOrigin === DEFAULT_API_ORIGIN ? 'official' : 'custom'
  )
  const [origin, setOrigin] = useState(apiOrigin === DEFAULT_API_ORIGIN ? '' : apiOrigin)
  const [model, setModel] = useState(apiModel)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const custom = apiOrigin !== DEFAULT_API_ORIGIN
    setMode(custom ? 'custom' : 'official')
    setOrigin(custom ? apiOrigin : '')
    setModel(apiModel)
  }, [apiOrigin, apiModel])

  const selectMode = (next: Mode) => {
    if (next === mode) {
      return
    }
    setError(null)
    setMode(next)
    if (next === 'official') {
      if (apiOrigin !== DEFAULT_API_ORIGIN) {
        setApiOrigin(DEFAULT_API_ORIGIN)
        setApiModel(DEFAULT_API_MODEL)
        showToast({ key: 'settingsApiEndpointOfficialSaved' })
      }
      setOrigin('')
      setModel(DEFAULT_API_MODEL)
      return
    }
    setOrigin(apiOrigin === DEFAULT_API_ORIGIN ? '' : apiOrigin)
    setModel(apiModel)
  }

  const save = () => {
    const normalized = normalizeApiOrigin(origin)
    if (!normalized) {
      setError(t('settingsApiEndpointInvalid'))
      return
    }
    if (normalized === DEFAULT_API_ORIGIN) {
      setApiOrigin(DEFAULT_API_ORIGIN)
      setApiModel(DEFAULT_API_MODEL)
      setMode('official')
      setOrigin('')
      setModel(DEFAULT_API_MODEL)
      setError(null)
      showToast({ key: 'settingsApiEndpointOfficialSaved' })
      return
    }
    const modelName = model.trim()
    if (!modelName || !MODEL_PATTERN.test(modelName)) {
      setError(t('settingsApiModelInvalid'))
      return
    }
    setError(null)
    setApiOrigin(normalized)
    setApiModel(modelName)
    setMode('custom')
    setOrigin(normalized)
    setModel(modelName)
    showToast({ key: 'settingsApiEndpointSaved' })
  }

  return (
    <div className={styles.cell}>
      <div className={styles.apiKey}>
        <div className={styles.label}>{t('settingsApiEndpoint')}</div>
        <div className={local.modes} role="radiogroup" aria-label={t('settingsApiEndpoint')}>
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'official'}
            className={clsx(local.mode, mode === 'official' && local.modeActive)}
            onClick={() => selectMode('official')}
          >
            {t('settingsApiEndpointOfficial')}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'custom'}
            className={clsx(local.mode, mode === 'custom' && local.modeActive)}
            onClick={() => selectMode('custom')}
          >
            {t('settingsApiEndpointCustom')}
          </button>
        </div>

        {mode === 'official' ? (
          <div className={styles.description}>
            {t('settingsApiEndpointOfficialDescription')}
          </div>
        ) : (
          <>
            <div className={styles.apiKeyInput}>
              <input
                type="url"
                inputMode="url"
                spellCheck={false}
                autoComplete="off"
                placeholder={t('settingsApiEndpointPlaceholder')}
                value={origin}
                onChange={(event) => {
                  setOrigin(event.target.value)
                  setError(null)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                    save()
                  }
                }}
              />
            </div>
            <div className={styles.apiKeyInput}>
              <input
                type="text"
                spellCheck={false}
                autoComplete="off"
                aria-label={t('settingsApiModel')}
                placeholder={t('settingsApiModelPlaceholder')}
                value={model}
                onChange={(event) => {
                  setModel(event.target.value)
                  setError(null)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                    save()
                  }
                }}
              />
              <span className={styles.divider} />
              <button
                type="button"
                className={styles.confirm}
                onMouseDown={(event) => event.preventDefault()}
                onClick={save}
              >
                {t('confirm')}
              </button>
            </div>
            <div className={styles.description}>{t('settingsApiEndpointDescription')}</div>
          </>
        )}
        {error ? <div className={styles.error}>{error}</div> : null}
      </div>
    </div>
  )
}
