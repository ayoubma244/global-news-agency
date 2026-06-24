'use client'

import { ExternalLink, Clock, Shield, FileText, CheckCircle2, AlertTriangle } from 'lucide-react'

interface Props {
  sourceUrl?: string | null
  sourceName?: string | null
  publishedAt?: string | null
  updatedAt?: string
  factCheckScore?: number | null
  verificationStatus?: string | null
}

export default function SourceTransparencyPanel({
  sourceUrl,
  sourceName,
  publishedAt,
  updatedAt,
  factCheckScore,
  verificationStatus,
}: Props) {
  if (!sourceUrl && !sourceName && !publishedAt) return null

  const formattedPublished = publishedAt
    ? new Date(publishedAt).toLocaleString('en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : null

  const formattedUpdated = updatedAt
    ? new Date(updatedAt).toLocaleString('en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : null

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-6">
      <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
        <Shield className="h-4 w-4 text-indigo-600" />
        Transparency & Sources
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {/* Source */}
        {sourceUrl && (
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Source</p>
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm flex items-center gap-1 break-all"
              >
                {sourceName || new URL(sourceUrl).hostname}
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>
            </div>
          </div>
        )}

        {/* Published time */}
        {formattedPublished && (
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Published</p>
              <p className="text-slate-700">{formattedPublished}</p>
            </div>
          </div>
        )}

        {/* Last updated */}
        {formattedUpdated && formattedUpdated !== formattedPublished && (
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Last Updated</p>
              <p className="text-slate-700">{formattedUpdated}</p>
            </div>
          </div>
        )}

        {/* Verification status */}
        {verificationStatus && (
          <div className="flex items-start gap-2">
            {verificationStatus === 'verified' ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            ) : verificationStatus === 'danger' ? (
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            ) : (
              <Shield className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p className="text-xs text-slate-500">AI Verification</p>
              <p className={`font-medium ${
                verificationStatus === 'verified' ? 'text-green-700' :
                verificationStatus === 'danger' ? 'text-red-700' :
                'text-amber-700'
              }`}>
                {verificationStatus === 'verified' ? 'Verified' :
                 verificationStatus === 'warning' ? 'Needs Review' :
                 verificationStatus === 'danger' ? 'Flagged' :
                 verificationStatus === 'unverified' ? 'Unverified' :
                 verificationStatus}
                {factCheckScore != null && ` (${factCheckScore}%)`}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
        Source: {sourceName || 'external source'}. All rights reserved by original publisher.
      </div>
    </div>
  )
}
