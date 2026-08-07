"use client";

import { useMemo, useState } from "react";
import type { Locale } from "../../../i18n/types";
import type { RiuHouseBookingTranslations } from "../../../i18n/riu-house/booking/types";
import type { OutsideVisitors, TripReason } from "../../../i18n/riu-house/booking/types";
import { formatDisplayDate } from "../../../lib/booking/costa-rica-dates";
import { isStayRangeValid } from "../../../lib/booking/availability";
import {
  generatePrototypeReference,
  isValidEmail,
  parseChildAges,
  validateGuestCounts,
} from "../../../lib/booking/validation";
import AvailabilityCalendar from "./AvailabilityCalendar";

const inputClassName =
  "mt-2 w-full min-h-[44px] rounded-xl border border-[#111111]/10 bg-white px-4 py-3 text-sm text-[#111111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C69C6D]";

const labelClassName = "block text-sm font-medium text-[#111111]";

type BookingRequestWizardProps = {
  bt: RiuHouseBookingTranslations;
  locale: Locale;
};

type FormErrors = Record<string, string>;

const tripReasonKeys: TripReason[] = [
  "vacation",
  "familyVisit",
  "specialOccasion",
  "businessRemote",
  "other",
];

const outsideVisitorKeys: OutsideVisitors[] = ["no", "yes", "notSure"];

export default function BookingRequestWizard({
  bt,
  locale,
}: BookingRequestWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [childAgesInput, setChildAgesInput] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [tripReason, setTripReason] = useState<TripReason | "">("");
  const [outsideVisitors, setOutsideVisitors] = useState<OutsideVisitors | "">("");
  const [message, setMessage] = useState("");
  const [agreedHouseRules, setAgreedHouseRules] = useState(false);
  const [agreedRequest, setAgreedRequest] = useState(false);

  const stepLabel = useMemo(
    () => bt.stepIndicator.replace("{current}", String(step)).replace("{total}", "2"),
    [bt.stepIndicator, step],
  );

  const resetForm = () => {
    setStep(1);
    setSubmitted(false);
    setReference("");
    setIsSubmitting(false);
    setErrors({});
    setCheckIn("");
    setCheckOut("");
    setAdults(2);
    setChildren(0);
    setChildAgesInput("");
    setFullName("");
    setEmail("");
    setPhone("");
    setCountry("");
    setTripReason("");
    setOutsideVisitors("");
    setMessage("");
    setAgreedHouseRules(false);
    setAgreedRequest(false);
  };

  const validateStep1 = (): FormErrors => {
    const next: FormErrors = {};
    if (!checkIn) next.checkIn = bt.errors.checkInRequired;
    if (!checkOut) next.checkOut = bt.errors.checkOutRequired;
    if (checkIn && checkOut && checkOut <= checkIn) {
      next.checkOut = bt.errors.checkOutAfterCheckIn;
    }
    if (checkIn && checkOut && !isStayRangeValid(checkIn, checkOut)) {
      next.checkOut = bt.errors.invalidStayRange;
    }

    const guestResult = validateGuestCounts(adults, children);
    if (guestResult === "noAdults") next.adults = bt.errors.noAdults;
    if (guestResult === "tooManyGuests") next.guests = bt.errors.tooManyGuests;

    if (children > 0) {
      const agesResult = parseChildAges(childAgesInput, children);
      if (!agesResult.ok) {
        const keyMap = {
          required: "childAgesRequired",
          countMismatch: "childAgesCountMismatch",
          invalidFormat: "childAgesNonNumeric",
          emptyValue: "childAgesEmptyValue",
          nonNumeric: "childAgesNonNumeric",
          decimal: "childAgesDecimal",
          outOfRange: "childAgesOutOfRange",
          mustBeAdult: "childAgesMustBeAdult",
        } as const;
        next.childAges = bt.errors[keyMap[agesResult.errorKey]];
      }
    }

    return next;
  };

  const validateStep2 = (): FormErrors => {
    const next: FormErrors = {};
    if (!fullName.trim()) next.fullName = bt.errors.fullNameRequired;
    if (!email.trim()) next.email = bt.errors.emailRequired;
    else if (!isValidEmail(email)) next.email = bt.errors.emailInvalid;
    if (!phone.trim()) next.phone = bt.errors.phoneRequired;
    if (!country.trim()) next.country = bt.errors.countryRequired;
    if (!tripReason) next.tripReason = bt.errors.tripReasonRequired;
    if (!outsideVisitors) next.outsideVisitors = bt.errors.outsideVisitorsRequired;
    if (!agreedHouseRules) next.houseRules = bt.errors.houseRulesRequired;
    if (!agreedRequest) next.requestAck = bt.errors.requestAckRequired;
    return next;
  };

  const handleStep1Continue = () => {
    const nextErrors = validateStep1();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setStep(2);
    }
  };

  const handleSubmit = () => {
    if (isSubmitting || submitted) return;

    const step1Errors = validateStep1();
    const step2Errors = validateStep2();
    const merged = { ...step1Errors, ...step2Errors };
    setErrors(merged);
    if (Object.keys(merged).length > 0) {
      if (Object.keys(step1Errors).length > 0) setStep(1);
      return;
    }

    setIsSubmitting(true);
    window.setTimeout(() => {
      setReference(generatePrototypeReference());
      setSubmitted(true);
      setIsSubmitting(false);
    }, 400);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#111111]/10 bg-white p-6 sm:p-8">
        <h3 className="font-serif text-2xl font-light tracking-tight text-[#111111] sm:text-3xl">
          {bt.confirmation.heading}
        </h3>
        <p className="mt-4 text-sm text-[#111111]/70">
          {bt.confirmation.referenceLabel}:{" "}
          <span className="font-medium text-[#111111]">{reference}</span>
        </p>
        {checkIn && checkOut && (
          <p className="mt-2 text-sm text-[#111111]/70">
            {formatDisplayDate(checkIn, locale)} → {formatDisplayDate(checkOut, locale)}
          </p>
        )}
        <div className="mt-6 space-y-3 text-sm leading-relaxed text-[#111111]/70">
          <p>{bt.confirmation.body1}</p>
          <p>{bt.confirmation.body2}</p>
          <p>{bt.confirmation.body3}</p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#C69C6D] px-8 py-3.5 text-sm font-medium tracking-wide text-white transition-all duration-300 hover:bg-[#b58a5c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C69C6D]"
          >
            {bt.confirmation.startOverButton}
          </button>
          <a
            href="#riu-house-details"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#111111]/15 bg-white px-8 py-3.5 text-sm font-medium tracking-wide text-[#111111] transition-colors hover:border-[#C69C6D]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C69C6D]"
          >
            {bt.confirmation.backToPropertyButton}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#111111]/10 bg-white p-6 sm:p-8">
      <p className="text-xs uppercase tracking-[0.25em] text-[#C69C6D]">{stepLabel}</p>
      <h3 className="mt-2 font-serif text-2xl font-light tracking-tight text-[#111111] sm:text-3xl">
        {step === 1 ? bt.step1Title : bt.step2Title}
      </h3>

      {step === 1 ? (
        <div className="mt-8 space-y-8">
          <AvailabilityCalendar
            bt={bt}
            locale={locale}
            checkIn={checkIn}
            checkOut={checkOut}
            onSelectCheckIn={(date) => {
              setCheckIn(date);
              setCheckOut("");
              setErrors((prev) => {
                const next = { ...prev };
                delete next.checkIn;
                delete next.checkOut;
                return next;
              });
            }}
            onSelectCheckOut={(date) => {
              setCheckOut(date);
              setErrors((prev) => {
                const next = { ...prev };
                delete next.checkOut;
                return next;
              });
            }}
            onRangeError={() =>
              setErrors((prev) => ({
                ...prev,
                checkOut: bt.errors.invalidStayRange,
              }))
            }
          />
          {errors.checkIn && (
            <p className="text-sm text-red-700" role="alert">
              {errors.checkIn}
            </p>
          )}
          {errors.checkOut && (
            <p className="text-sm text-red-700" role="alert">
              {errors.checkOut}
            </p>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="booking-adults" className={labelClassName}>
                {bt.adultsLabel}
              </label>
              <select
                id="booking-adults"
                value={adults}
                onChange={(event) => setAdults(Number(event.target.value))}
                className={inputClassName}
              >
                {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              {errors.adults && (
                <p className="mt-2 text-sm text-red-700" role="alert">
                  {errors.adults}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="booking-children" className={labelClassName}>
                {bt.childrenLabel}
              </label>
              <select
                id="booking-children"
                value={children}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setChildren(next);
                  if (next === 0) setChildAgesInput("");
                }}
                className={inputClassName}
              >
                {Array.from({ length: 8 }, (_, i) => i).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errors.guests && (
            <p className="text-sm text-red-700" role="alert">
              {errors.guests}
            </p>
          )}

          <p className="text-sm leading-relaxed text-[#111111]/65">{bt.occupancyHelper}</p>

          {children > 0 && (
            <div>
              <label htmlFor="booking-child-ages" className={labelClassName}>
                {bt.childAgesLabel}
              </label>
              <input
                id="booking-child-ages"
                type="text"
                inputMode="numeric"
                value={childAgesInput}
                onChange={(event) => setChildAgesInput(event.target.value)}
                placeholder={bt.childAgesPlaceholder}
                className={inputClassName}
                aria-describedby="booking-child-ages-help"
              />
              {errors.childAges && (
                <p className="mt-2 text-sm text-red-700" role="alert">
                  {errors.childAges}
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleStep1Continue}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-[#C69C6D] px-8 py-3.5 text-sm font-medium tracking-wide text-white transition-all duration-300 hover:bg-[#b58a5c] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C69C6D] sm:w-auto"
          >
            {bt.requestDatesButton}
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="rounded-xl bg-[#F8F6F2] px-4 py-3 text-sm text-[#111111]/70">
            {checkIn && checkOut && (
              <p>
                {formatDisplayDate(checkIn, locale)} → {formatDisplayDate(checkOut, locale)}
              </p>
            )}
            <p className="mt-1">
              {adults} {bt.adultsLabel.toLowerCase()}
              {children > 0 ? ` · ${children} ${bt.childrenLabel.toLowerCase()}` : ""}
            </p>
          </div>

          <div>
            <label htmlFor="booking-full-name" className={labelClassName}>
              {bt.fullNameLabel}
            </label>
            <input
              id="booking-full-name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className={inputClassName}
            />
            {errors.fullName && (
              <p className="mt-2 text-sm text-red-700" role="alert">
                {errors.fullName}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="booking-email" className={labelClassName}>
                {bt.emailLabel}
              </label>
              <input
                id="booking-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClassName}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-700" role="alert">
                  {errors.email}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="booking-phone" className={labelClassName}>
                {bt.phoneLabel}
              </label>
              <input
                id="booking-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className={inputClassName}
              />
              {errors.phone && (
                <p className="mt-2 text-sm text-red-700" role="alert">
                  {errors.phone}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="booking-country" className={labelClassName}>
              {bt.countryLabel}
            </label>
            <input
              id="booking-country"
              type="text"
              autoComplete="country-name"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className={inputClassName}
            />
            {errors.country && (
              <p className="mt-2 text-sm text-red-700" role="alert">
                {errors.country}
              </p>
            )}
          </div>

          <fieldset>
            <legend className={labelClassName}>{bt.tripReasonLabel}</legend>
            <div className="mt-3 space-y-2">
              {tripReasonKeys.map((key) => (
                <label
                  key={key}
                  className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-[#111111]/10 px-4 py-2 text-sm text-[#111111]/80 has-[:checked]:border-[#C69C6D]/50"
                >
                  <input
                    type="radio"
                    name="trip-reason"
                    value={key}
                    checked={tripReason === key}
                    onChange={() => setTripReason(key)}
                    className="h-4 w-4 accent-[#C69C6D]"
                  />
                  {bt.tripReasons[key]}
                </label>
              ))}
            </div>
            {errors.tripReason && (
              <p className="mt-2 text-sm text-red-700" role="alert">
                {errors.tripReason}
              </p>
            )}
          </fieldset>

          <fieldset>
            <legend className={`${labelClassName} max-w-prose`}>
              {bt.outsideVisitorsLabel}
            </legend>
            <div className="mt-3 space-y-2">
              {outsideVisitorKeys.map((key) => (
                <label
                  key={key}
                  className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-[#111111]/10 px-4 py-2 text-sm text-[#111111]/80 has-[:checked]:border-[#C69C6D]/50"
                >
                  <input
                    type="radio"
                    name="outside-visitors"
                    value={key}
                    checked={outsideVisitors === key}
                    onChange={() => setOutsideVisitors(key)}
                    className="h-4 w-4 accent-[#C69C6D]"
                  />
                  {bt.outsideVisitorsOptions[key]}
                </label>
              ))}
            </div>
            {errors.outsideVisitors && (
              <p className="mt-2 text-sm text-red-700" role="alert">
                {errors.outsideVisitors}
              </p>
            )}
          </fieldset>

          <div>
            <label htmlFor="booking-message" className={labelClassName}>
              {bt.optionalMessageLabel}
            </label>
            <textarea
              id="booking-message"
              rows={3}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={bt.optionalMessagePlaceholder}
              className={`${inputClassName} min-h-[88px] resize-y`}
            />
          </div>

          <p className="rounded-xl border border-[#111111]/10 bg-[#F8F6F2] px-4 py-3 text-sm leading-relaxed text-[#111111]/70">
            {bt.requestNotice}
          </p>

          <label className="flex min-h-[44px] cursor-pointer items-start gap-3 text-sm text-[#111111]/80">
            <input
              type="checkbox"
              checked={agreedHouseRules}
              onChange={(event) => setAgreedHouseRules(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-[#C69C6D]"
            />
            <span>{bt.houseRulesCheckbox}</span>
          </label>
          {errors.houseRules && (
            <p className="text-sm text-red-700" role="alert">
              {errors.houseRules}
            </p>
          )}

          <label className="flex min-h-[44px] cursor-pointer items-start gap-3 text-sm text-[#111111]/80">
            <input
              type="checkbox"
              checked={agreedRequest}
              onChange={(event) => setAgreedRequest(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-[#C69C6D]"
            />
            <span>{bt.requestNotConfirmedCheckbox}</span>
          </label>
          {errors.requestAck && (
            <p className="text-sm text-red-700" role="alert">
              {errors.requestAck}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#111111]/15 bg-white px-8 py-3.5 text-sm font-medium tracking-wide text-[#111111] transition-colors hover:border-[#C69C6D]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C69C6D]"
            >
              {bt.backButton}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#C69C6D] px-8 py-3.5 text-sm font-medium tracking-wide text-white transition-all duration-300 hover:bg-[#b58a5c] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C69C6D] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? bt.submitting : bt.sendRequestButton}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
