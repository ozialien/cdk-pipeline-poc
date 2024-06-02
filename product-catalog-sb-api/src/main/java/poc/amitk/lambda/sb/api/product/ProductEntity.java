package poc.amitk.lambda.sb.api.product;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

import java.io.Serializable;
import java.time.ZonedDateTime;

/**
 * @author amitkapps
 */
@Entity(name = "product")
public class ProductEntity implements Serializable {
    @Id
    private String productSku;

    private String productName;

    private ZonedDateTime createdTime;

    private ZonedDateTime launchDate;

    public ZonedDateTime getLaunchDate() {
        return launchDate;
    }

    public void setLaunchDate(ZonedDateTime launchDate) {
        this.launchDate = launchDate;
    }


    public ZonedDateTime getCreatedTime() {
        return createdTime;
    }

    public void setCreatedTime(ZonedDateTime created) {
        this.createdTime = created;
    }

    protected ProductEntity(){}

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
}
