import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "пользовательское соглашение — bless",
  description: "пользовательское соглашение и политика конфиденциальности bless",
};

export default function TermsPage() {
  return (
    <section className="stack">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 600, color: "#333", margin: 0, letterSpacing: "-0.5px" }}>пользовательское соглашение</h1>
        <span style={{ border: "1px solid #fce7f3", color: "#f1a7c8", padding: "4px 12px", borderRadius: "20px", fontSize: "13px" }}>legal</span>
      </div>
      <p style={{ color: "#8e8e8e", fontSize: "16px", marginBottom: "32px" }}>
        последнее обновление: {new Date().toLocaleDateString("ru-RU")}
      </p>

      <div className="card" style={{ padding: "40px", borderRadius: "48px" }}>
        <h2 style={{ color: "#333", marginTop: 0, fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>1. общие положения</h2>
        <p>
          настоящее пользовательское соглашение (далее — «соглашение») регулирует
          отношения между [укажите наименование] (далее — «администрация»)
          и физическим лицом (далее — «пользователь»), использующим сайт
          bless.
        </p>
        <p>
          используя сайт, пользователь подтверждает своё согласие с условиями
          настоящего соглашения.
        </p>

        <h2 style={{ color: "#333", marginTop: "32px", fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>2. предмет соглашения</h2>
        <p>
          администрация предоставляет пользователю доступ к каталогу товаров,
          возможность оформления заказа и оплаты через сервис юkassa.
        </p>

        <h2 style={{ color: "#333", marginTop: "32px", fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>3. оформление заказа и оплата</h2>
        <p>
          заказ считается оформленным после заполнения формы доставки и
          подтверждения оплаты. все цены указаны в рублях рф и включают ндс.
        </p>
        <p>
          оплата производится непосредственно на сайте через защищённый шлюз
          юkassa. переадресация на сторонние ресурсы для оплаты не осуществляется.
        </p>

        <h2 style={{ color: "#333", marginTop: "32px", fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>4. доставка и возврат</h2>
        <p>
          доставка осуществляется курьерскими службами или почтой в соответствии
          с выбранным способом. сроки и стоимость указаны на странице
          «доставка и оплата».
        </p>
        <p>
          пользователь вправе отказаться от товара надлежащего качества в
          течение 7 дней с момента получения. возврат оформляется через
          сервис сдэк. сумма возврата перечисляется за вычетом транспортных
          расходов в течение 10 дней с момента поступления возврата на склад.
        </p>

        <h2 style={{ color: "#333", marginTop: "32px", fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>5. конфиденциальность</h2>
        <p>
          администрация обрабатывает персональные данные пользователя в
          соответствии с федеральным законом № 152-фз «о персональных данных».
          данные используются исключительно для обработки заказов и связи с
          пользователем.
        </p>

        <h2 style={{ color: "#333", marginTop: "32px", fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>6. ответственность сторон</h2>
        <p>
          администрация не несёт ответственности за временные сбои в работе
          сайта, вызванные техническими причинами. в случае форс-мажорных
          обстоятельств сроки доставки могут быть увеличены.
        </p>

        <h2 style={{ color: "#333", marginTop: "32px", fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>7. реквизиты</h2>
        <p>
          [укажите наименование]
          <br />
          инн: [укажите инн]
          <br />
          огрнип: [укажите огрнип]
          <br />
          email: <a href="mailto:support@brandbless.ru">support@brandbless.ru</a>
          <br />
          телефон: [укажите телефон]
        </p>
      </div>
    </section>
  );
}
