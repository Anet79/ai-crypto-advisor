import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useExternalLinkGuard } from "../hooks/useExternalLinkGuard";
import { getApiErrorMessage } from "../utils/apiError";

const coinOptions = ["bitcoin", "ethereum", "solana", "dogecoin"];
const investorTypes = ["HODLer", "Day Trader", "NFT Collector"];
const contentOptions = ["Market News", "Coin Prices", "AI Insight", "Fun"];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { markPreferencesSaved, revalidateSession } = useAuth();

  useExternalLinkGuard(".onboarding-page");

  const [coins, setCoins] = useState<string[]>([]);
  const [investorType, setInvestorType] = useState("");
  const [contentTypes, setContentTypes] = useState<string[]>([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleItem = (
    value: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (coins.length === 0 || !investorType || contentTypes.length === 0) {
      setError("Please answer all questions");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/onboarding", {
        coins,
        investorType,
        contentTypes,
      });

      markPreferencesSaved();
      await revalidateSession();
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to save onboarding"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page auth-page onboarding-page">
      <div className="auth-page__inner auth-page__inner--wide onboarding-page__inner">
        <form
          className="app-glass-card onboarding-form"
          onSubmit={handleSubmit}
        >
          <header className="onboarding-hero">
            <h1 className="auth-title">Personalize your dashboard</h1>
            <p className="auth-subtitle">
              Answer a few questions so we can tailor your daily crypto experience.
            </p>
          </header>

          <div className="onboarding-sections">
            <section
              className="onboarding-section"
              aria-labelledby="onboarding-coins-heading"
            >
              <div className="onboarding-section__head">
                <span className="onboarding-step" aria-hidden="true">
                  1
                </span>
                <h2 id="onboarding-coins-heading" className="onboarding-section__title">
                  Which crypto assets interest you?
                </h2>
              </div>
              <div className="onboarding-chips">
                {coinOptions.map((coin) => (
                  <button
                    type="button"
                    key={coin}
                    className={`onboarding-chip${
                      coins.includes(coin) ? " onboarding-chip--selected" : ""
                    }`}
                    onClick={() => toggleItem(coin, coins, setCoins)}
                  >
                    {coin}
                  </button>
                ))}
              </div>
            </section>

            <section
              className="onboarding-section"
              aria-labelledby="onboarding-investor-heading"
            >
              <div className="onboarding-section__head">
                <span className="onboarding-step" aria-hidden="true">
                  2
                </span>
                <h2 id="onboarding-investor-heading" className="onboarding-section__title">
                  What type of investor are you?
                </h2>
              </div>
              <div className="onboarding-chips">
                {investorTypes.map((type) => (
                  <button
                    type="button"
                    key={type}
                    className={`onboarding-chip${
                      investorType === type ? " onboarding-chip--selected" : ""
                    }`}
                    onClick={() => setInvestorType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </section>

            <section
              className="onboarding-section"
              aria-labelledby="onboarding-content-heading"
            >
              <div className="onboarding-section__head">
                <span className="onboarding-step" aria-hidden="true">
                  3
                </span>
                <h2 id="onboarding-content-heading" className="onboarding-section__title">
                  What content do you want to see?
                </h2>
              </div>
              <div className="onboarding-chips">
                {contentOptions.map((content) => (
                  <button
                    type="button"
                    key={content}
                    className={`onboarding-chip${
                      contentTypes.includes(content) ? " onboarding-chip--selected" : ""
                    }`}
                    onClick={() => toggleItem(content, contentTypes, setContentTypes)}
                  >
                    {content}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            className="auth-btn auth-btn--success onboarding-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Saving..." : "Continue to dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
