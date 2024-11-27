package poc.amitk.lambda.sb.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
//import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;

import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.AWSXRayRecorderBuilder;
import com.amazonaws.xray.spring.aop.XRayEnabled;



@SpringBootApplication
@XRayEnabled
//(exclude = { SecurityAutoConfiguration.class })
public class ProductCatalogSbApiApplication {

	public static void main(String[] args) {
		AWSXRay.setGlobalRecorder(AWSXRayRecorderBuilder.standard().build());
		SpringApplication.run(ProductCatalogSbApiApplication.class, args);
	}

}
