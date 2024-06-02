package poc.amitk.lambda.sb.api.product;

import java.time.ZonedDateTime;

/**
 * @author amitkapps
 */
public class Product {
    private String productSku;
    private String productName;

    private ZonedDateTime addedToCatalogOn;

    private ZonedDateTime launchDate;

    public ZonedDateTime getLaunchDate() {
        return launchDate;
    }

    public void setLaunchDate(ZonedDateTime launchDate) {
        this.launchDate = launchDate;
    }


    public ZonedDateTime getAddedToCatalogOn() {
        return addedToCatalogOn;
    }

    public void setAddedToCatalogOn(ZonedDateTime addedToCatalogOn) {
        this.addedToCatalogOn = addedToCatalogOn;
    }


    public String getProductSku() {
        return productSku;
    }

    public void setProductSku(String productSku) {
        this.productSku = productSku;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    @Override
    public String toString() {
        return "Product{" +
                "productSku='" + productSku + '\'' +
                ", productName='" + productName + '\'' +
                ", addedToCatalogOn=" + addedToCatalogOn +
                ", launchDate=" + launchDate +
                '}';
    }
}
