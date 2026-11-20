import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { useTranslate } from '../../i18n/index.js'
import {
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
 * API 设置：默认使用官方服务，也可以切换到第三方兼容服务。
 * 两种模式都可以修改模型名，官方服务默认使用 deepseek-flash。
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

  const validateModel = (): string | null => {
    const modelName = model.trim()
    if (!modelName || !MODEL_PATTERN.test(modelName)) {
      setError(t('settingsApiModelInvalid'))
      return null
    }
    return modelName
  }

  const saveOfficialModel = () => {
    const modelName = validateModel()
    if (!modelName) {
      return
    }
    const wasCustom = apiOrigin !== DEFAULT_API_ORIGIN
    setError(null)
    if (wasCustom) {
      setApiOrigin(DEFAULT_API_ORIGIN)
    }
    setApiModel(modelName)
    setMode('official')
    setOrigin('')
    setModel(modelName)
    showToast({ key: wasCustom ? 'settingsApiEndpointOfficialSaved' : 'settingsApiModelSaved' })
  }

  const saveCustom = () => {
    const normalized = normalizeApiOrigin(origin)
    if (!normalized) {
      setError(t('settingsApiEndpointInvalid'))
      return
    }
    if (normalized === DEFAULT_API_ORIGIN) {
      saveOfficialModel()
      return
    }
    const modelName = validateModel()
    if (!modelName) {
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

  const selectMode = (next: Mode) => {
    if (next === mode) {
      return
    }
    setError(null)
    setMode(next)
    if (next === 'official') {
      if (apiOrigin !== DEFAULT_API_ORIGIN) {
        setApiOrigin(DEFAULT_API_ORIGIN)
        setOrigin('')
        showToast({ key: 'settingsApiEndpointOfficialSaved' })
      }
      setModel(apiModel)
      return
    }
    setOrigin(apiOrigin === DEFAULT_API_ORIGIN ? '' : apiOrigin)
    setModel(apiModel)
  }

  const modelInput = (
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
            if (mode === 'official') {
              saveOfficialModel()
            } else {
              saveCustom()
            }
          }
        }}
      />
      <span className={styles.divider} />
      <button
        type="button"
        className={styles.confirm}
        onMouseDown={(event) => event.preventDefault()}
        onClick={mode === 'official' ? saveOfficialModel : saveCustom}
      >
        {t('confirm')}
      </button>
    </div>
  )

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
          <>
            <div className={styles.description}>
              {t('settingsApiEndpointOfficialDescription')}
            </div>
            {modelInput}
          </>
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
                    saveCustom()
                  }
                }}
              />
            </div>
            {modelInput}
            <div className={styles.description}>{t('settingsApiEndpointDescription')}</div>
          </>
        )}
        {error ? <div className={styles.error}>{error}</div> : null}
      </div>
    </div>
  )
}
