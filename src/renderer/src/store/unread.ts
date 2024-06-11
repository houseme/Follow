import { apiClient } from "@renderer/lib/api-fetch"
import type { FeedViewType } from "@renderer/lib/enum"
import { produce } from "immer"

import { createZustandStore, getStoreActions } from "./utils/helper"

interface UnreadState {
  data: Record<string, number>
}
interface UnreadActions {
  updateByFeedId: (feedId: string, unread: number) => void
  fetchUnreadByView: (view?: FeedViewType) => Promise<Record<string, number>>
  fetchUnreadAll: () => Promise<Record<string, number>>
  incrementByFeedId: (feedId: string, inc: number) => void

  internal_reset: () => void
}
export const useUnreadStore = createZustandStore<UnreadState & UnreadActions>(
  "unread",
  {
    version: 0,
  },
)((set) => ({
  data: {},

  internal_reset() {
    set({ data: {} })
  },

  async fetchUnreadByView(view) {
    const unread = await apiClient.reads.$get({
      query: { view: String(view) },
    })

    const { data } = unread

    set((state) =>
      produce(state, (state) => {
        for (const [key, value] of Object.entries(data)) {
          state.data[key] = value
        }
      }),
    )
    return data
  },
  async fetchUnreadAll() {
    const unread = await apiClient.reads.$get({
      query: {},
    })

    const { data } = unread
    this.internal_reset()
    set((state) =>
      produce(state, (state) => {
        for (const [key, value] of Object.entries(data)) {
          state.data[key] = value
        }
      }),
    )
    return data
  },
  incrementByFeedId: (feedId, inc: number) => {
    set((state) =>
      produce(state, (state) => {
        const cur = state.data[feedId]
        if (cur === undefined) {
          state.data[feedId] = inc
          return state
        }
        state.data[feedId] = (cur || 0) + inc
        return state
      }),
    )
  },
  updateByFeedId: (feedId, unread) => {
    set((state) =>
      produce(state, (state) => {
        state.data[feedId] = unread
        return state
      }),
    )
  },
}))

export const unreadActions = getStoreActions(useUnreadStore)