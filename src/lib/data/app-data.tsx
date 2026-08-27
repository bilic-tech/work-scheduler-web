"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getBootstrapAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  type BootstrapPayload,
} from "@/actions/auth";
import {
  createLeaveRequestAction,
  reviewLeaveRequestAction,
} from "@/actions/leave";
import { getAnnualBalance } from "@/lib/leave";
import { visibleRequestsForRole } from "@/lib/rbac";
import type {
  AppNotification,
  CreateRequestInput,
  LeaveRequest,
  LeaveRequestWithProfile,
  Profile,
  ReviewRequestInput,
} from "@/lib/types";

interface AppDataValue {
  hydrated: boolean;
  currentUser: Profile | null;
  profiles: Profile[];
  requests: LeaveRequest[];
  visibleRequests: LeaveRequestWithProfile[];
  notifications: AppNotification[];
  unreadCount: number;
  createRequest: (input: CreateRequestInput) => Promise<void>;
  reviewRequest: (input: ReviewRequestInput) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const AppDataContext = createContext<AppDataValue | null>(null);

function withProfiles(
  requests: LeaveRequest[],
  profiles: Profile[],
): LeaveRequestWithProfile[] {
  return requests
    .map((request) => ({
      ...request,
      profile: profiles.find((profile) => profile.id === request.userId)!,
      assignedManager: request.assignedManagerId
        ? profiles.find((profile) => profile.id === request.assignedManagerId) ??
          null
        : null,
      reviewer: request.reviewedBy
        ? profiles.find((profile) => profile.id === request.reviewedBy) ?? null
        : null,
    }))
    .filter((request) => Boolean(request.profile));
}

export function AppDataProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData: BootstrapPayload;
}) {
  const queryClient = useQueryClient();
  useState(() => {
    queryClient.setQueryData(["app-bootstrap"], initialData);
    return true;
  });

  const bootstrap = useQuery({
    queryKey: ["app-bootstrap"],
    queryFn: getBootstrapAction,
    initialData,
  });

  const currentUser = bootstrap.data?.currentUser ?? null;
  const profiles = bootstrap.data?.profiles ?? [];
  const requests = bootstrap.data?.requests ?? [];
  const notifications = bootstrap.data?.notifications ?? [];

  const createRequest = useCallback(
    async (input: CreateRequestInput) => {
      if (!currentUser) throw new Error("Sign in to submit a request.");
      if (input.leaveType === "annual") {
        const balance = getAnnualBalance(currentUser, requests);
        if (input.totalDays > balance.available) {
          throw new Error(
            `Only ${balance.available} annual leave day${balance.available === 1 ? "" : "s"} remaining.`,
          );
        }
      }
      await createLeaveRequestAction(input);
      await queryClient.invalidateQueries({ queryKey: ["app-bootstrap"] });
    },
    [currentUser, requests, queryClient],
  );

  const reviewRequest = useCallback(
    async (input: ReviewRequestInput) => {
      if (!currentUser) throw new Error("Sign in to review requests.");
      await reviewLeaveRequestAction(input);
      await queryClient.invalidateQueries({ queryKey: ["app-bootstrap"] });
    },
    [currentUser, queryClient],
  );

  const markNotificationRead = useCallback(
    async (id: string) => {
      await markNotificationReadAction(id);
      await queryClient.invalidateQueries({ queryKey: ["app-bootstrap"] });
    },
    [queryClient],
  );

  const markAllNotificationsRead = useCallback(async () => {
    await markAllNotificationsReadAction();
    await queryClient.invalidateQueries({ queryKey: ["app-bootstrap"] });
  }, [queryClient]);

  const visibleRequests = useMemo(() => {
    if (!currentUser) return [];
    return withProfiles(
      visibleRequestsForRole(requests, currentUser),
      profiles,
    );
  }, [requests, currentUser, profiles]);

  const value = useMemo<AppDataValue>(
    () => ({
      hydrated: bootstrap.isFetched,
      currentUser,
      profiles,
      requests,
      visibleRequests,
      notifications,
      unreadCount: notifications.filter((item) => !item.readAt).length,
      createRequest,
      reviewRequest,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [
      bootstrap.isFetched,
      currentUser,
      profiles,
      requests,
      visibleRequests,
      notifications,
      createRequest,
      reviewRequest,
      markNotificationRead,
      markAllNotificationsRead,
    ],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return context;
}
